const express = require('express');
const db = require('../database/init');
const { requireAuth, requireSupervisor } = require('../middleware/auth');
const { notifyUsers } = require('./notifications');

// Leave and salary-advance requests. Same flow as the missing-data requests:
// the employee submits, a supervisor/admin of the employee's shift approves or
// rejects, and everyone involved gets a notification.
const router = express.Router();

['get', 'post'].forEach(m => {
  const orig = router[m].bind(router);
  router[m] = (path, ...handlers) => orig(path, ...handlers.map(fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)));
});

const LEAVE_TYPES = { annual: 'اعتيادية', casual: 'عارضة', sick: 'مرضية', unpaid: 'بدون مرتب' };
const KINDS = { leave: 'طلب إجازة', advance: 'طلب سلفة' };
const MAX_LEAVE_DAYS = 60;
const MAX_BACKDATE_DAYS = 30;
const MAX_AMOUNT = 1_000_000;

const isoDay = d => d.toISOString().slice(0, 10);
function validDate(v) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? s : null;
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
const fmtMoney = n => String(Number(Number(n).toFixed(2)));

function shiftScope(req) {
  if (req.user.role !== 'supervisor') return null;
  const s = Array.isArray(req.user.supervisorShifts) && req.user.supervisorShifts.length ? req.user.supervisorShifts : [req.user.shift || ''];
  return s.map(String);
}
async function reviewersFor(shift) {
  const rows = await db.prepare(
    `SELECT id FROM employees
      WHERE role IN ('admin','system_creator')
         OR (role = 'supervisor' AND (shift = ? OR ? = ANY(COALESCE(supervisor_shifts, ARRAY[]::text[]))))`
  ).all(shift || '', shift || '');
  return rows.map(r => r.id);
}
async function writeAudit(req, action, entityId, details) {
  try {
    await db.prepare(`INSERT INTO audit_logs (actor_id, actor_name, action, entity_type, entity_id, details_json, ip)
      VALUES (?, ?, ?, 'employee_request', ?, ?::jsonb, ?)`)
      .run(Number(req.user?.id) || null, req.user?.name || null, action, String(entityId), JSON.stringify(details || {}), req.ip || null);
  } catch (e) { console.error('Audit log write failed:', e); }
}
const requireEmployee = (req, res, next) => {
  if (req.user?.role !== 'employee') return res.status(403).json({ error: 'تقديم الطلبات متاح للموظفين فقط.' });
  next();
};
const describe = r => r.kind === 'leave'
  ? `إجازة ${LEAVE_TYPES[r.leave_type] || ''} — ${String(r.start_date).slice(0, 10)} → ${String(r.end_date).slice(0, 10)} (${r.days} يوم)`
  : `سلفة ${fmtMoney(r.amount)}`;

// ---- Employee side ----
router.get('/options', requireAuth, requireEmployee, async (req, res) => {
  const emp = await db.prepare('SELECT id, name, shift, company, department FROM employees WHERE id = ?').get(Number(req.user.id));
  const now = new Date();
  res.json({
    employee: emp, leaveTypes: LEAVE_TYPES,
    window: { min: isoDay(new Date(now.getTime() - MAX_BACKDATE_DAYS * 86400000)) },
    maxLeaveDays: MAX_LEAVE_DAYS,
  });
});

router.post('/', requireAuth, requireEmployee, async (req, res) => {
  const empId = Number(req.user.id);
  const kind = String(req.body?.kind ?? '');
  const notes = String(req.body?.notes ?? '').trim().slice(0, 1000) || null;
  if (!KINDS[kind]) return res.status(400).json({ error: 'نوع الطلب غير صحيح.' });
  const emp = await db.prepare("SELECT id, name, shift FROM employees WHERE id = ? AND role = 'employee'").get(empId);
  if (!emp) return res.status(404).json({ error: 'الموظف غير موجود.' });

  let leaveType = null, start = null, end = null, days = null, amount = null;
  if (kind === 'leave') {
    leaveType = String(req.body?.leave_type ?? '');
    start = validDate(req.body?.start_date);
    end = validDate(req.body?.end_date);
    if (!LEAVE_TYPES[leaveType]) return res.status(400).json({ error: 'اختر نوع الإجازة.' });
    if (!start || !end) return res.status(400).json({ error: 'اختر تاريخ بداية ونهاية الإجازة.' });
    if (end < start) return res.status(400).json({ error: 'تاريخ النهاية قبل تاريخ البداية.' });
    if (start < isoDay(new Date(Date.now() - MAX_BACKDATE_DAYS * 86400000))) return res.status(400).json({ error: `لا يمكن طلب إجازة قبل أكثر من ${MAX_BACKDATE_DAYS} يومًا.` });
    days = daysBetween(start, end);
    if (days > MAX_LEAVE_DAYS) return res.status(400).json({ error: `أقصى مدة للطلب الواحد ${MAX_LEAVE_DAYS} يومًا.` });
    const clash = await db.prepare(
      `SELECT id FROM employee_requests WHERE employee_id = ? AND kind = 'leave' AND status IN ('pending','approved')
         AND start_date <= ? AND end_date >= ? LIMIT 1`
    ).get(empId, end, start);
    if (clash) return res.status(409).json({ error: 'يوجد طلب إجازة (قيد المراجعة أو معتمد) يتقاطع مع هذه الفترة.', code: 'duplicate' });
  } else {
    amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return res.status(400).json({ error: 'أدخل مبلغ سلفة صحيح.' });
    if (!notes) return res.status(400).json({ error: 'اكتب سبب السلفة في الملاحظات.' });
    const open = await db.prepare("SELECT id FROM employee_requests WHERE employee_id = ? AND kind = 'advance' AND status = 'pending' LIMIT 1").get(empId);
    if (open) return res.status(409).json({ error: 'لديك طلب سلفة قيد المراجعة بالفعل.', code: 'duplicate' });
  }

  const created = await db.prepare(
    `INSERT INTO employee_requests (employee_id, employee_name, shift, kind, leave_type, start_date, end_date, days, amount, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).get(empId, emp.name, emp.shift || null, kind, leaveType, start, end, days, amount, notes);
  const row = { kind, leave_type: leaveType, start_date: start, end_date: end, days, amount };
  await writeAudit(req, 'employee_request_create', created.id, { employee_id: empId, ...row });
  await notifyUsers(await reviewersFor(emp.shift), {
    type: 'employee_request', title: `${KINDS[kind]} جديد`, body: `${emp.name} — ${describe(row)}`, link: '/missing-data.html'
  });
  res.json({ ok: true, id: created.id });
});

router.get('/mine', requireAuth, requireEmployee, async (req, res) => {
  const rows = await db.prepare(
    `SELECT id, kind, leave_type, start_date, end_date, days, amount, notes, status, reviewed_by_name, reviewed_at, reject_reason, created_at
       FROM employee_requests WHERE employee_id = ? ORDER BY created_at DESC, id DESC LIMIT 200`
  ).all(Number(req.user.id));
  res.json({ requests: rows });
});

router.post('/:id/cancel', requireAuth, requireEmployee, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'طلب غير صالح.' });
  const r = await db.prepare("UPDATE employee_requests SET status = 'cancelled' WHERE id = ? AND employee_id = ? AND status = 'pending' RETURNING id")
    .get(id, Number(req.user.id));
  if (!r) return res.status(409).json({ error: 'لا يمكن إلغاء هذا الطلب (تمت مراجعته أو ليس لك).' });
  await writeAudit(req, 'employee_request_cancel', id, {});
  res.json({ ok: true });
});

// ---- Supervisor / admin side ----
router.get('/review', requireAuth, requireSupervisor, async (req, res) => {
  const scope = shiftScope(req);
  const status = String(req.query.status || 'pending');
  const kind = String(req.query.kind || '');
  const params = [];
  let where = 'WHERE 1=1';
  if (scope) { params.push(scope); where += ` AND COALESCE(r.shift,'') = ANY($${params.length}::text[])`; }
  if (KINDS[kind]) { params.push(kind); where += ` AND r.kind = $${params.length}`; }
  const counts = (await db.query(`SELECT r.status, COUNT(*)::int AS c FROM employee_requests r ${where} GROUP BY r.status`, params))
    .rows.reduce((a, x) => (a[x.status] = x.c, a), {});
  if (['pending', 'approved', 'rejected', 'cancelled'].includes(status)) { params.push(status); where += ` AND r.status = $${params.length}`; }
  const rows = (await db.query(
    `SELECT r.id, r.employee_id, r.employee_name, r.shift, r.kind, r.leave_type, r.start_date, r.end_date, r.days, r.amount, r.notes,
            r.status, r.reviewed_by_name, r.reviewed_at, r.reject_reason, r.created_at
       FROM employee_requests r ${where} ORDER BY r.created_at DESC, r.id DESC LIMIT 500`, params
  )).rows;
  res.json({ requests: rows, counts });
});

async function loadForReview(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: 'طلب غير صالح.' }); return null; }
  const r = await db.prepare('SELECT * FROM employee_requests WHERE id = ?').get(id);
  if (!r) { res.status(404).json({ error: 'الطلب غير موجود.' }); return null; }
  const scope = shiftScope(req);
  if (scope && !scope.includes(String(r.shift || ''))) { res.status(403).json({ error: 'هذا الطلب خارج الشيفتات المسندة إليك.' }); return null; }
  if (Number(r.employee_id) === Number(req.user.id)) { res.status(403).json({ error: 'لا يمكنك مراجعة طلبك الشخصي.' }); return null; }
  return r;
}

router.post('/:id/approve', requireAuth, requireSupervisor, async (req, res) => {
  const r = await loadForReview(req, res); if (!r) return;
  const claimed = await db.prepare(
    `UPDATE employee_requests SET status = 'approved', reviewed_by = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending' RETURNING id`
  ).get(Number(req.user.id), req.user.name || null, r.id);
  if (!claimed) return res.status(409).json({ error: 'تمت مراجعة هذا الطلب بالفعل.' });
  await writeAudit(req, 'employee_request_approve', r.id, { employee_id: r.employee_id, kind: r.kind, approved_by: req.user.name || null });
  await notifyUsers([r.employee_id], { type: 'employee_request_approved', title: 'تم اعتماد طلبك', body: describe(r), link: '/missing-data.html' });
  res.json({ ok: true });
});

router.post('/:id/revert', requireAuth, requireSupervisor, async (req, res) => {
  const r = await loadForReview(req, res); if (!r) return;
  const claimed = await db.prepare(
    `UPDATE employee_requests SET status = 'pending', reviewed_by = NULL, reviewed_by_name = NULL, reviewed_at = NULL, reject_reason = NULL
      WHERE id = ? AND status = 'approved' RETURNING id`
  ).get(r.id);
  if (!claimed) return res.status(409).json({ error: 'يمكن التراجع عن الطلبات المعتمدة فقط.' });
  await writeAudit(req, 'employee_request_revert', r.id, { employee_id: r.employee_id, kind: r.kind, reverted_by: req.user.name || null });
  await notifyUsers([r.employee_id], { type: 'employee_request_reverted', title: 'تم إلغاء اعتماد طلبك', body: `${describe(r)} — عاد الطلب قيد المراجعة`, link: '/missing-data.html' });
  res.json({ ok: true });
});

router.post('/:id/reject', requireAuth, requireSupervisor, async (req, res) => {
  const reason = String(req.body?.reason ?? '').trim().slice(0, 500);
  if (!reason) return res.status(400).json({ error: 'اكتب سبب الرفض.' });
  const r = await loadForReview(req, res); if (!r) return;
  const claimed = await db.prepare(
    `UPDATE employee_requests SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending' RETURNING id`
  ).get(reason, Number(req.user.id), req.user.name || null, r.id);
  if (!claimed) return res.status(409).json({ error: 'تمت مراجعة هذا الطلب بالفعل.' });
  await writeAudit(req, 'employee_request_reject', r.id, { employee_id: r.employee_id, kind: r.kind, reason, rejected_by: req.user.name || null });
  await notifyUsers([r.employee_id], { type: 'employee_request_rejected', title: 'تم رفض طلبك', body: `${describe(r)} — السبب: ${reason}`, link: '/missing-data.html' });
  res.json({ ok: true });
});

module.exports = router;
