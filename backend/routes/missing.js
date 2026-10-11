const express = require('express');
const db = require('../database/init');
const { requireAuth, requireSupervisor } = require('../middleware/auth');
const { notifyUsers } = require('./notifications');

const router = express.Router();

// Express 4 does not forward rejected promises from async handlers to the error
// middleware, which would leave the request hanging. Wrap every handler.
['get', 'post'].forEach(m => {
  const orig = router[m].bind(router);
  router[m] = (path, ...handlers) => orig(path, ...handlers.map(fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)));
});

const REASONS = { missing: 'اليوم غير مسجل نهائيًا', incomplete: 'البيانات مسجلة بشكل ناقص', wrong: 'الكمية المسجلة غير صحيحة' };
const ATTENDANCE_STAGE = 'الحضور';
const MAX_BACKDATE_DAYS = 62;
const MAX_QTY = 1_000_000;

async function writeAudit(req, action, entityId, details) {
  try {
    await db.prepare(`INSERT INTO audit_logs (actor_id, actor_name, action, entity_type, entity_id, details_json, ip)
      VALUES (?, ?, ?, 'missing_data_request', ?, ?::jsonb, ?)`)
      .run(Number(req.user?.id) || null, req.user?.name || null, action, String(entityId), JSON.stringify(details || {}), req.ip || null);
  } catch (e) { console.error('Audit log write failed:', e); }
}

const isoDay = d => d.toISOString().slice(0, 10);
function validDate(v) {
  const s = String(v ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? s : null;
}
function dateWindow() {
  const now = new Date();
  const max = new Date(now.getTime() + 24 * 3600 * 1000); // tolerate timezone difference
  const min = new Date(now.getTime() - MAX_BACKDATE_DAYS * 24 * 3600 * 1000);
  return { min: isoDay(min), max: isoDay(max) };
}

// Supervisors only see/handle employees of their own shifts; admins see all.
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
const fmtQty = n => (Number.isInteger(Number(n)) ? String(Number(n)) : String(Number(Number(n).toFixed(2))));

// What is already recorded for this employee/stage/day (null = nothing recorded).
async function recordedValue(employeeId, stage, date) {
  const r = await db.prepare('SELECT value_num, value_text FROM stage_daily WHERE employee_id = ? AND stage = ? AND entry_date = ?').get(employeeId, stage, date);
  if (!r) return null;
  if (r.value_num !== null && r.value_num !== undefined) return { value: Number(r.value_num) };
  if (r.value_text !== null && String(r.value_text).trim() !== '') return { value: null, text: String(r.value_text) };
  return null;
}

const requireEmployee = (req, res, next) => {
  if (req.user?.role !== 'employee') return res.status(403).json({ error: 'تقديم الطلبات متاح للموظفين فقط.' });
  next();
};

// ---- Employee side ----
router.get('/options', requireAuth, requireEmployee, async (req, res) => {
  const id = Number(req.user.id);
  const emp = await db.prepare('SELECT id, name, shift, company, department FROM employees WHERE id = ?').get(id);
  const rows = await db.prepare(
    `SELECT stage FROM (
        SELECT DISTINCT stage FROM stage_daily WHERE employee_id = ?
        UNION SELECT DISTINCT stage FROM employee_stage_targets WHERE employee_id = ?
     ) s WHERE stage IS NOT NULL AND stage <> ? ORDER BY stage`
  ).all(id, id, ATTENDANCE_STAGE);
  res.json({ employee: emp, stages: rows.map(r => r.stage), reasons: REASONS, window: dateWindow() });
});

// Live hint used by the form: is the day already recorded / already requested?
router.get('/check', requireAuth, requireEmployee, async (req, res) => {
  const date = validDate(req.query.date), stage = String(req.query.stage || '').trim();
  if (!date || !stage) return res.json({ recorded: null, pending: null });
  const id = Number(req.user.id);
  const recorded = await recordedValue(id, stage, date);
  const pending = await db.prepare(
    "SELECT id, quantity, reason_type, created_at FROM missing_data_requests WHERE employee_id = ? AND stage = ? AND entry_date = ? AND status = 'pending'"
  ).get(id, stage, date);
  res.json({ recorded, pending: pending || null });
});

router.post('/', requireAuth, requireEmployee, async (req, res) => {
  const empId = Number(req.user.id); // Rule 2: always the logged-in employee, never taken from the body.
  const date = validDate(req.body?.entry_date);
  const stage = String(req.body?.stage ?? '').trim();
  const reasonType = String(req.body?.reason_type ?? '');
  const notes = String(req.body?.notes ?? '').trim().slice(0, 1000) || null;
  const qtyRaw = req.body?.quantity;
  const quantity = qtyRaw === '' || qtyRaw === null || qtyRaw === undefined ? NaN : Number(qtyRaw);

  if (!date) return res.status(400).json({ error: 'اختر تاريخًا صحيحًا.' });
  const win = dateWindow();
  if (date > win.max) return res.status(400).json({ error: 'لا يمكن تقديم طلب لتاريخ مستقبلي.' });
  if (date < win.min) return res.status(400).json({ error: `لا يمكن تقديم طلب لتاريخ أقدم من ${MAX_BACKDATE_DAYS} يومًا.` });
  if (!stage || stage === ATTENDANCE_STAGE) return res.status(400).json({ error: 'اختر المرحلة.' });
  if (!REASONS[reasonType]) return res.status(400).json({ error: 'اختر سبب الطلب.' });
  if (!Number.isFinite(quantity) || quantity < 0 || quantity > MAX_QTY) return res.status(400).json({ error: 'أدخل كمية صحيحة (رقم موجب).' });

  const emp = await db.prepare("SELECT id, name, shift FROM employees WHERE id = ? AND role = 'employee'").get(empId);
  if (!emp) return res.status(404).json({ error: 'الموظف غير موجود.' });

  const known = await db.prepare(
    `SELECT 1 AS ok FROM stage_daily WHERE employee_id = ? AND stage = ? LIMIT 1`
  ).get(empId, stage) || await db.prepare('SELECT 1 AS ok FROM employee_stage_targets WHERE employee_id = ? AND stage = ? LIMIT 1').get(empId, stage);
  if (!known) return res.status(400).json({ error: 'هذه المرحلة غير مسجلة على حسابك.' });

  // Rule 1: show the earlier open request instead of creating another one.
  const pending = await db.prepare(
    "SELECT id, quantity, reason_type, created_at FROM missing_data_requests WHERE employee_id = ? AND stage = ? AND entry_date = ? AND status = 'pending'"
  ).get(empId, stage, date);
  if (pending) return res.status(409).json({ error: 'يوجد طلب قيد المراجعة لنفس اليوم والمرحلة.', code: 'duplicate', existing: pending });

  // Rule 5: day already recorded -> it must be a correction request, not "missing".
  const recorded = await recordedValue(empId, stage, date);
  if (recorded && reasonType === 'missing') {
    return res.status(409).json({
      error: `هذا اليوم مسجل بالفعل${recorded.value !== null ? ` (القيمة ${fmtQty(recorded.value)})` : ''}. قدّم طلب تصحيح (بيانات ناقصة / كمية غير صحيحة) بدل طلب يوم مفقود.`,
      code: 'already_recorded', recorded
    });
  }
  if (!recorded && reasonType !== 'missing') {
    return res.status(409).json({ error: 'هذا اليوم غير مسجل أصلًا. اختر السبب "اليوم غير مسجل نهائيًا".', code: 'not_recorded' });
  }
  if (recorded && recorded.value !== null && Number(recorded.value) === quantity) {
    return res.status(400).json({ error: 'الكمية المدخلة مطابقة للمسجلة بالفعل.' });
  }

  let created;
  try {
    created = await db.prepare(
      `INSERT INTO missing_data_requests (employee_id, employee_name, shift, entry_date, stage, quantity, reason_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
    ).get(empId, emp.name, emp.shift || null, date, stage, quantity, reasonType, notes);
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'يوجد طلب قيد المراجعة لنفس اليوم والمرحلة.', code: 'duplicate' });
    throw e;
  }
  // Rule 3: nothing in stage_daily changes here. Only on approval.
  await writeAudit(req, 'missing_request_create', created.id, { employee_id: empId, stage, entry_date: date, quantity, reason_type: reasonType, current_value: recorded ? recorded.value : null });
  await notifyUsers(await reviewersFor(emp.shift), {
    type: 'missing_request',
    title: 'طلب استكمال بيانات جديد',
    body: `${emp.name} — ${stage} — ${date} — الكمية ${fmtQty(quantity)}`,
    link: '/missing-data.html'
  });
  res.json({ ok: true, id: created.id });
});

router.get('/mine', requireAuth, requireEmployee, async (req, res) => {
  const rows = await db.prepare(
    `SELECT id, entry_date, stage, quantity, reason_type, notes, status, old_value, new_value, reviewed_by_name, reviewed_at, reject_reason, created_at
       FROM missing_data_requests WHERE employee_id = ? ORDER BY created_at DESC, id DESC LIMIT 200`
  ).all(Number(req.user.id));
  res.json({ requests: rows });
});

router.post('/:id/cancel', requireAuth, requireEmployee, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'طلب غير صالح.' });
  const r = await db.prepare(
    "UPDATE missing_data_requests SET status = 'cancelled' WHERE id = ? AND employee_id = ? AND status = 'pending' RETURNING id"
  ).get(id, Number(req.user.id));
  if (!r) return res.status(409).json({ error: 'لا يمكن إلغاء هذا الطلب (تمت مراجعته أو ليس لك).' });
  await writeAudit(req, 'missing_request_cancel', id, {});
  res.json({ ok: true });
});

// ---- Supervisor / admin side ----
router.get('/review', requireAuth, requireSupervisor, async (req, res) => {
  const scope = shiftScope(req);
  const status = String(req.query.status || 'pending');
  const params = [];
  let where = 'WHERE 1=1';
  if (scope) { params.push(scope); where += ` AND COALESCE(r.shift,'') = ANY($${params.length}::text[])`; }
  const counts = (await db.query(
    `SELECT r.status, COUNT(*)::int AS c FROM missing_data_requests r ${where} GROUP BY r.status`, params
  )).rows.reduce((a, x) => (a[x.status] = x.c, a), {});
  if (['pending', 'approved', 'rejected', 'cancelled'].includes(status)) { params.push(status); where += ` AND r.status = $${params.length}`; }
  const rows = (await db.query(
    `SELECT r.id, r.employee_id, r.employee_name, r.shift, r.entry_date, r.stage, r.quantity, r.reason_type, r.notes, r.status,
            r.old_value, r.new_value, r.reviewed_by_name, r.reviewed_at, r.reject_reason, r.created_at,
            (SELECT value_num FROM stage_daily d WHERE d.employee_id = r.employee_id AND d.stage = r.stage AND d.entry_date = r.entry_date) AS current_value
       FROM missing_data_requests r ${where} ORDER BY r.created_at DESC, r.id DESC LIMIT 500`, params
  )).rows;
  res.json({ requests: rows, counts });
});

async function loadForReview(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: 'طلب غير صالح.' }); return null; }
  const r = await db.prepare('SELECT * FROM missing_data_requests WHERE id = ?').get(id);
  if (!r) { res.status(404).json({ error: 'الطلب غير موجود.' }); return null; }
  const scope = shiftScope(req);
  if (scope && !scope.includes(String(r.shift || ''))) { res.status(403).json({ error: 'هذا الطلب خارج الشيفتات المسندة إليك.' }); return null; }
  if (Number(r.employee_id) === Number(req.user.id)) { res.status(403).json({ error: 'لا يمكنك مراجعة طلبك الشخصي.' }); return null; }
  return r;
}

router.post('/:id/approve', requireAuth, requireSupervisor, async (req, res) => {
  const r = await loadForReview(req, res); if (!r) return;
  const tx = db.transaction(async () => {
    // The status guard makes a double click / two reviewers safe: only one wins.
    const claimed = await db.prepare(
      `UPDATE missing_data_requests SET status = 'approved', reviewed_by = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending' RETURNING id`
    ).get(Number(req.user.id), req.user.name || null, r.id);
    if (!claimed) return null;
    const before = await recordedValue(r.employee_id, r.stage, String(r.entry_date).slice(0, 10));
    const oldValue = before && before.value !== null ? before.value : null;
    await db.query(
      `INSERT INTO stage_daily (employee_id, stage, entry_date, value_num, value_text)
       VALUES ($1, $2, $3, $4, NULL)
       ON CONFLICT (employee_id, stage, entry_date) DO UPDATE SET value_num = excluded.value_num, value_text = NULL`,
      [r.employee_id, r.stage, String(r.entry_date).slice(0, 10), r.quantity]
    );
    await db.query('UPDATE missing_data_requests SET old_value = $2, new_value = $3, old_text = $4 WHERE id = $1', [r.id, oldValue, r.quantity, before && before.text ? before.text : null]);
    return { oldValue };
  });
  const out = await tx();
  if (!out) return res.status(409).json({ error: 'تمت مراجعة هذا الطلب بالفعل.' });
  const day = String(r.entry_date).slice(0, 10);
  await writeAudit(req, 'missing_request_approve', r.id, { employee_id: r.employee_id, stage: r.stage, entry_date: day, old_value: out.oldValue, new_value: Number(r.quantity), approved_by: req.user.name || null });
  await notifyUsers([r.employee_id], { type: 'missing_approved', title: 'تم اعتماد طلبك', body: `${r.stage} — ${day} — الكمية ${fmtQty(r.quantity)}`, link: '/missing-data.html' });
  res.json({ ok: true, old_value: out.oldValue, new_value: Number(r.quantity) });
});

// Undo an approval: put the day back exactly as it was and re-open the request.
router.post('/:id/revert', requireAuth, requireSupervisor, async (req, res) => {
  const r = await loadForReview(req, res); if (!r) return;
  if (r.status !== 'approved') return res.status(409).json({ error: 'يمكن التراجع عن الطلبات المعتمدة فقط.' });
  const day = String(r.entry_date).slice(0, 10);
  const tx = db.transaction(async () => {
    const claimed = await db.prepare(
      `UPDATE missing_data_requests SET status = 'pending', reviewed_by = NULL, reviewed_by_name = NULL, reviewed_at = NULL, reject_reason = NULL
        WHERE id = ? AND status = 'approved' RETURNING id`
    ).get(r.id);
    if (!claimed) return { error: 'تمت مراجعة هذا الطلب بالفعل.' };
    // Safety: if the day was changed again after this approval, do not overwrite newer data.
    const now = await recordedValue(r.employee_id, r.stage, day);
    if (!now || now.value === null || Number(now.value) !== Number(r.new_value)) {
      throw Object.assign(new Error('stale'), { stale: true });
    }
    if (r.old_value !== null && r.old_value !== undefined) {
      await db.query('UPDATE stage_daily SET value_num = $4, value_text = NULL WHERE employee_id = $1 AND stage = $2 AND entry_date = $3', [r.employee_id, r.stage, day, r.old_value]);
    } else if (r.old_text) {
      await db.query('UPDATE stage_daily SET value_num = NULL, value_text = $4 WHERE employee_id = $1 AND stage = $2 AND entry_date = $3', [r.employee_id, r.stage, day, r.old_text]);
    } else {
      await db.query('DELETE FROM stage_daily WHERE employee_id = $1 AND stage = $2 AND entry_date = $3', [r.employee_id, r.stage, day]);
    }
    await db.query('UPDATE missing_data_requests SET old_value = NULL, new_value = NULL, old_text = NULL WHERE id = $1', [r.id]);
    return { ok: true };
  });
  let out;
  try { out = await tx(); }
  catch (e) {
    if (e && e.stale) return res.status(409).json({ error: 'لا يمكن التراجع: قيمة اليوم تغيّرت بعد الاعتماد. عدّلها يدويًا من الإدخال اليدوي.' });
    throw e;
  }
  if (out.error) return res.status(409).json({ error: out.error });
  await writeAudit(req, 'missing_request_revert', r.id, { employee_id: r.employee_id, stage: r.stage, entry_date: day, restored_value: r.old_value ?? null, reverted_by: req.user.name || null });
  await notifyUsers([r.employee_id], { type: 'missing_reverted', title: 'تم إلغاء اعتماد طلبك', body: `${r.stage} — ${day} — عاد الطلب قيد المراجعة`, link: '/missing-data.html' });
  res.json({ ok: true });
});

router.post('/:id/reject', requireAuth, requireSupervisor, async (req, res) => {
  const reason = String(req.body?.reason ?? '').trim().slice(0, 500);
  if (!reason) return res.status(400).json({ error: 'اكتب سبب الرفض.' });
  const r = await loadForReview(req, res); if (!r) return;
  const claimed = await db.prepare(
    `UPDATE missing_data_requests SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_by_name = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending' RETURNING id`
  ).get(reason, Number(req.user.id), req.user.name || null, r.id);
  if (!claimed) return res.status(409).json({ error: 'تمت مراجعة هذا الطلب بالفعل.' });
  const day = String(r.entry_date).slice(0, 10);
  await writeAudit(req, 'missing_request_reject', r.id, { employee_id: r.employee_id, stage: r.stage, entry_date: day, reason, rejected_by: req.user.name || null });
  await notifyUsers([r.employee_id], { type: 'missing_rejected', title: 'تم رفض طلبك', body: `${r.stage} — ${day} — السبب: ${reason}`, link: '/missing-data.html' });
  res.json({ ok: true });
});

// Badge on the "الطلبات" nav item: open missing-data requests + open leave/advance requests.
router.get('/pending-count', requireAuth, requireSupervisor, async (req, res) => {
  const scope = shiftScope(req);
  const count = async table => (scope
    ? (await db.query(`SELECT COUNT(*)::int AS c FROM ${table} WHERE status = 'pending' AND COALESCE(shift,'') = ANY($1::text[])`, [scope])).rows[0]
    : (await db.query(`SELECT COUNT(*)::int AS c FROM ${table} WHERE status = 'pending'`)).rows[0]).c;
  const [missing, other] = await Promise.all([count('missing_data_requests'), count('employee_requests')]);
  res.json({ pending: missing + other, missing, other });
});

module.exports = router;
