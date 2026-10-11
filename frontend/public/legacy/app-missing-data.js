// Missing Data Requests page.
//  - employee: submit a request for a missing / incomplete / wrong day, track own requests
//  - supervisor / admin: review (approve / reject) requests of their scope
(() => {
  const token = sessionStorage.getItem('iems_token');
  let user = null;
  try { user = JSON.parse(sessionStorage.getItem('iems_user') || 'null'); } catch (_) {}
  if (!token || !user) { location.href = '/index.html'; return; }
  const $ = id => document.getElementById(id);
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  async function api(url, opt = {}) {
    const r = await fetch(url, { ...opt, headers: { ...headers, ...(opt.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = Error(d.error || 'حدث خطأ'); e.data = d; throw e; }
    return d;
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const day = v => (v ? String(v).slice(0, 10) : '');
  const fd = v => (v ? day(v).split('-').reverse().join('/') : '—');
  const fdt = v => { if (!v) return '—'; const d = new Date(v); return isNaN(d) ? '—' : d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }); };
  const num = v => (v === null || v === undefined || v === '' ? '—' : String(Number(Number(v).toFixed(2))));
  const REASONS = { missing: 'اليوم غير مسجل نهائيًا', incomplete: 'البيانات مسجلة بشكل ناقص', wrong: 'الكمية المسجلة غير صحيحة' };
  const STATUS = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض', cancelled: 'ملغي' };
  const badge = s => `<span class="md-badge ${esc(s)}">${esc(STATUS[s] || s)}</span>`;

  $('chip-name').textContent = user.name || '—';
  $('chip-role').textContent = user.role === 'system_creator' ? 'منشئ النظام' : user.role === 'admin' ? 'مدير النظام' : user.role === 'supervisor' ? 'مشرف' : 'موظف';
  $('chip-avatar').textContent = (user.name || '?')[0];
  $('logout-btn').onclick = () => { sessionStorage.clear(); location.href = '/index.html'; };

  const isEmployee = user.role === 'employee';
  const isReviewer = ['supervisor', 'admin', 'system_creator'].includes(user.role);
  if (!isEmployee && !isReviewer) { location.href = '/home.html'; return; }

  // ---------------- Employee ----------------
  async function initEmployee() {
    $('md-employee').style.display = '';
    $('md-desc').textContent = 'قدّم طلبًا لتسجيل أو تصحيح يوم ناقص. الطلب يصل للمشرف، ولا يتغير التارجت إلا بعد اعتماده.';
    $('md-list-title').textContent = 'طلباتي';
    $('md-thead').innerHTML = '<tr><th>التاريخ</th><th>المرحلة</th><th>الكمية</th><th>السبب</th><th>الحالة</th><th>المراجعة</th><th></th></tr>';

    let opts;
    try { opts = await api('/api/missing/options'); }
    catch (e) { $('md-error').textContent = e.message; return; }
    $('md-name').value = opts.employee?.name || user.name || '';
    $('md-code').value = opts.employee?.id ?? user.id;
    $('md-stage').innerHTML = '<option value="">اختر المرحلة</option>' + opts.stages.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
    $('md-date').min = opts.window.min; $('md-date').max = opts.window.max;
    $('md-reasons').innerHTML = Object.entries(opts.reasons).map(([k, v], i) => `<label><input type="radio" name="md-reason" value="${k}" ${i === 0 ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('');

    const hint = $('md-hint'), submit = $('md-submit');
    let state = { recorded: null, pending: null };
    const reason = () => (document.querySelector('input[name="md-reason"]:checked') || {}).value;
    function showHint(cls, html) { hint.className = 'md-hint ' + cls; hint.innerHTML = html; hint.style.display = ''; }
    async function refreshHint() {
      hint.style.display = 'none'; submit.disabled = false;
      const date = $('md-date').value, stage = $('md-stage').value;
      if (!date || !stage) return;
      try { state = await api(`/api/missing/check?date=${encodeURIComponent(date)}&stage=${encodeURIComponent(stage)}`); } catch (_) { return; }
      if (state.pending) {
        showHint('warn', `يوجد طلب سابق قيد المراجعة لنفس اليوم والمرحلة (الكمية ${esc(num(state.pending.quantity))}). لا حاجة لطلب جديد — يمكنك إلغاؤه من الجدول وتقديم بديل.`);
        submit.disabled = true; return;
      }
      if (state.recorded) {
        const cur = state.recorded.value !== null ? num(state.recorded.value) : esc(state.recorded.text || '');
        if (reason() === 'missing') {
          showHint('warn', `هذا اليوم مسجل بالفعل (القيمة الحالية ${cur}). قدّم طلب تصحيح: اختر "البيانات مسجلة بشكل ناقص" أو "الكمية المسجلة غير صحيحة".`);
          submit.disabled = true;
        } else showHint('info', `القيمة المسجلة حاليًا: ${cur}. بعد الاعتماد ستُستبدل بالكمية التي تدخلها.`);
      } else if (reason() !== 'missing') {
        showHint('warn', 'هذا اليوم غير مسجل أصلًا. اختر السبب "اليوم غير مسجل نهائيًا".');
        submit.disabled = true;
      }
    }
    ['md-date', 'md-stage'].forEach(id => $(id).addEventListener('change', refreshHint));
    $('md-reasons').addEventListener('change', refreshHint);

    submit.addEventListener('click', async () => {
      $('md-error').textContent = '';
      const body = { entry_date: $('md-date').value, stage: $('md-stage').value, quantity: $('md-qty').value, reason_type: reason(), notes: $('md-notes').value };
      if (!body.entry_date) return void ($('md-error').textContent = 'اختر التاريخ.');
      if (!body.stage) return void ($('md-error').textContent = 'اختر المرحلة.');
      if (body.quantity === '' || !(Number(body.quantity) >= 0)) return void ($('md-error').textContent = 'أدخل الكمية الفعلية.');
      submit.disabled = true;
      try {
        await api('/api/missing', { method: 'POST', body: JSON.stringify(body) });
        $('md-qty').value = ''; $('md-notes').value = '';
        showHint('info', 'تم إرسال الطلب للمشرف. ستصلك إشعارات بالقرار.');
        await loadMine();
      } catch (e) {
        $('md-error').textContent = e.message;
        if (e.data && (e.data.code === 'already_recorded' || e.data.code === 'duplicate' || e.data.code === 'not_recorded')) refreshHint();
      } finally { if (!state.pending && !(state.recorded && reason() === 'missing')) submit.disabled = false; }
    });

    async function loadMine() {
      try {
        const d = await api('/api/missing/mine');
        $('md-tbody').innerHTML = d.requests.map(r => `<tr>
          <td>${fd(r.entry_date)}</td><td>${esc(r.stage)}</td><td>${num(r.quantity)}${r.status === 'approved' && r.old_value !== null ? `<span class="md-sub">كانت ${num(r.old_value)}</span>` : ''}</td>
          <td>${esc(REASONS[r.reason_type] || r.reason_type)}${r.notes ? `<span class="md-sub">${esc(r.notes)}</span>` : ''}</td>
          <td>${badge(r.status)}</td>
          <td>${r.reviewed_by_name ? `${esc(r.reviewed_by_name)}<span class="md-sub">${fdt(r.reviewed_at)}</span>` : '—'}${r.reject_reason ? `<span class="md-sub">السبب: ${esc(r.reject_reason)}</span>` : ''}</td>
          <td>${r.status === 'pending' ? `<div class="md-row-actions"><button class="cancel" data-cancel="${r.id}">إلغاء الطلب</button></div>` : ''}</td></tr>`).join('')
          || '<tr><td colspan="7"><div class="empty-state">لم تقدّم أي طلبات بعد.</div></td></tr>';
      } catch (e) { $('md-tbody').innerHTML = `<tr><td colspan="7"><div class="empty-state">${esc(e.message)}</div></td></tr>`; }
    }
    $('md-tbody').addEventListener('click', async e => {
      const b = e.target.closest('[data-cancel]'); if (!b) return;
      if (!confirm('إلغاء هذا الطلب؟')) return;
      b.disabled = true;
      try { await api(`/api/missing/${b.dataset.cancel}/cancel`, { method: 'POST' }); } catch (err) { alert(err.message); }
      await loadMine(); refreshHint();
    });
    loadMine();
  }

  // ---------------- Reviewer ----------------
  function initReviewer() {
    $('md-desc').textContent = 'راجع طلبات الموظفين. عند الاعتماد فقط تُحدّث بيانات اليوم ويُسجَّل الاعتماد في سجل العمليات.';
    $('md-list-title').textContent = 'الطلبات';
    $('md-tabs').style.display = '';
    $('md-thead').innerHTML = '<tr><th>الموظف</th><th>الشيفت</th><th>التاريخ</th><th>المرحلة</th><th>المسجل حاليًا</th><th>المطلوب</th><th>السبب</th><th>الحالة</th><th>الإجراء</th></tr>';
    let status = 'pending', rows = [], counts = {};
    const TABS = [['pending', 'قيد المراجعة'], ['approved', 'معتمد'], ['rejected', 'مرفوض'], ['all', 'الكل']];
    function paintTabs() {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      $('md-tabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === status ? 'active' : ''}">${l}<b>${k === 'all' ? total : (counts[k] || 0)}</b></button>`).join('');
    }
    async function load() {
      try {
        const d = await api('/api/missing/review?status=' + encodeURIComponent(status));
        rows = d.requests; counts = d.counts || {}; paintTabs();
        $('md-tbody').innerHTML = rows.map(r => `<tr>
          <td>${esc(r.employee_name)}<span class="md-sub">ID ${esc(r.employee_id)}</span></td><td>${esc(r.shift || '—')}</td><td>${fd(r.entry_date)}</td><td>${esc(r.stage)}</td>
          <td>${r.status === 'approved' ? num(r.old_value) : num(r.current_value)}</td><td><b>${num(r.quantity)}</b></td>
          <td>${esc(REASONS[r.reason_type] || r.reason_type)}${r.notes ? `<span class="md-sub">${esc(r.notes)}</span>` : ''}<span class="md-sub">قُدّم ${fdt(r.created_at)}</span></td>
          <td>${badge(r.status)}${r.reviewed_by_name ? `<span class="md-sub">${esc(r.reviewed_by_name)} · ${fdt(r.reviewed_at)}</span>` : ''}${r.reject_reason ? `<span class="md-sub">${esc(r.reject_reason)}</span>` : ''}</td>
          <td>${r.status === 'pending' ? `<div class="md-row-actions"><button class="ok" data-ok="${r.id}">اعتماد</button><button class="no" data-no="${r.id}">رفض</button></div>` : ''}</td></tr>`).join('')
          || '<tr><td colspan="9"><div class="empty-state">لا توجد طلبات.</div></td></tr>';
      } catch (e) { $('md-tbody').innerHTML = `<tr><td colspan="9"><div class="empty-state">${esc(e.message)}</div></td></tr>`; }
      if (window.__iemsRefreshNotifications) window.__iemsRefreshNotifications();
    }
    $('md-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; status = b.dataset.tab; load(); });

    let rejectId = null;
    const modal = $('md-reject-modal');
    const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); rejectId = null; };
    $('md-reject-close').onclick = closeModal; $('md-reject-cancel').onclick = closeModal;
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    $('md-reject-confirm').onclick = async () => {
      const reason = $('md-reject-reason').value.trim();
      if (!reason) { $('md-reject-error').textContent = 'اكتب سبب الرفض.'; return; }
      $('md-reject-confirm').disabled = true;
      try { await api(`/api/missing/${rejectId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }); closeModal(); }
      catch (e) { $('md-reject-error').textContent = e.message; }
      finally { $('md-reject-confirm').disabled = false; }
      load();
    };
    $('md-tbody').addEventListener('click', async e => {
      const ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]');
      if (ok) {
        const r = rows.find(x => String(x.id) === ok.dataset.ok); if (!r) return;
        const cur = r.current_value === null || r.current_value === undefined ? 'غير مسجل' : num(r.current_value);
        if (!confirm(`اعتماد: ${r.employee_name} — ${r.stage} — ${fd(r.entry_date)}\nالقيمة الحالية: ${cur}  ←  الجديدة: ${num(r.quantity)}`)) return;
        ok.disabled = true;
        try { await api(`/api/missing/${r.id}/approve`, { method: 'POST' }); } catch (err) { alert(err.message); }
        load();
      } else if (no) {
        const r = rows.find(x => String(x.id) === no.dataset.no); if (!r) return;
        rejectId = r.id; $('md-reject-who').textContent = `${r.employee_name} — ${r.stage} — ${fd(r.entry_date)}`;
        $('md-reject-reason').value = ''; $('md-reject-error').textContent = '';
        modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
      }
    });
    load();
  }

  if (isEmployee) initEmployee(); else initReviewer();
})();
