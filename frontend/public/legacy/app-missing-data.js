// Requests page (missing data, leave, salary advance).
//  - employee: pick a request type, submit it, track own requests
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
  const LEAVE = { annual: 'اعتيادية', casual: 'عارضة', sick: 'مرضية', unpaid: 'بدون مرتب' };
  const KIND_LABEL = { missing: 'استكمال بيانات', leave: 'إجازة', advance: 'سلفة' };
  const kindBadge = k => `<span class="md-kind">${esc(KIND_LABEL[k] || k)}</span>`;
  const badge = s => `<span class="md-badge ${esc(s)}">${esc(STATUS[s] || s)}</span>`;

  $('chip-name').textContent = user.name || '—';
  $('chip-role').textContent = user.role === 'system_creator' ? 'منشئ النظام' : user.role === 'admin' ? 'مدير النظام' : user.role === 'supervisor' ? 'مشرف' : 'موظف';
  $('chip-avatar').textContent = (user.name || '?')[0];
  $('logout-btn').onclick = () => { sessionStorage.clear(); location.href = '/index.html'; };

  const isEmployee = user.role === 'employee';
  const isReviewer = ['supervisor', 'admin', 'system_creator'].includes(user.role);
  if (!isEmployee && !isReviewer) { location.href = '/home.html'; return; }

  // ---------------- shared helpers ----------------
  // One flat row shape for both the employee's list and the reviewer's queue.
  //   src 'm' = missing_data_requests, 'r' = employee_requests (leave / advance)
  function normalize(r, src) {
    const kind = src === 'm' ? 'missing' : r.kind;
    let detail;
    if (kind === 'missing') {
      detail = `${esc(r.stage)} — ${fd(r.entry_date)}<span class="md-sub">${esc(REASONS[r.reason_type] || r.reason_type)} · الكمية <b>${num(r.quantity)}</b>${r.status === 'approved' && r.old_value !== null && r.old_value !== undefined ? ` (كانت ${num(r.old_value)})` : (r.current_value !== undefined && r.status === 'pending' ? ` (المسجل ${r.current_value === null ? 'لا شيء' : num(r.current_value)})` : '')}</span>`;
    } else if (kind === 'leave') {
      detail = `إجازة ${esc(LEAVE[r.leave_type] || '')} — ${r.days} ${Number(r.days) === 1 ? 'يوم' : 'أيام'}<span class="md-sub">من ${fd(r.start_date)} إلى ${fd(r.end_date)}</span>`;
    } else {
      detail = `مبلغ <b>${num(r.amount)}</b>`;
    }
    if (r.notes) detail += `<span class="md-sub">${esc(r.notes)}</span>`;
    return { key: src + ':' + r.id, src, id: r.id, kind, detail, r };
  }
  const reviewCell = r => `${badge(r.status)}${r.reviewed_by_name ? `<span class="md-sub">${esc(r.reviewed_by_name)} · ${fdt(r.reviewed_at)}</span>` : ''}${r.reject_reason ? `<span class="md-sub">السبب: ${esc(r.reject_reason)}</span>` : ''}`;
  const apiBase = src => (src === 'm' ? '/api/missing' : '/api/requests');
  const byDate = (a, b) => String(b.r.created_at).localeCompare(String(a.r.created_at));
  function setBtnBusy(btn, busy) { btn.disabled = busy; }

  // ---------------- Employee ----------------
  async function initEmployee() {
    $('md-employee').style.display = '';
    $('md-desc').textContent = 'قدّم طلبك من النوع المناسب: استكمال بيانات، إجازة، أو سلفة. يصل الطلب للمشرف وتصلك إشعارات بالقرار.';
    $('md-list-title').textContent = 'طلباتي';
    $('md-thead').innerHTML = '<tr><th>النوع</th><th>التفاصيل</th><th>الحالة</th><th>تاريخ الطلب</th><th></th></tr>';

    // type switcher
    const types = $('rq-types');
    types.addEventListener('click', e => {
      const b = e.target.closest('[data-type]'); if (!b) return;
      types.querySelectorAll('.rq-type').forEach(t => t.classList.toggle('active', t === b));
      document.querySelectorAll('.rq-form').forEach(p => p.classList.toggle('active', p.id === 'rq-panel-' + b.dataset.type));
    });
    // employee's own list is shown as cards, not the reviewer table
    $('md-table-wrap').style.display = 'none'; $('rq-cards').style.display = '';
    const say = (el, text, ok) => { el.className = 'rq-msg ' + (ok ? 'ok' : 'err'); el.textContent = text; };

    let opts, lopts;
    try { [opts, lopts] = await Promise.all([api('/api/missing/options'), api('/api/requests/options')]); }
    catch (e) { $('md-error').textContent = e.message; return; }

    // ----- missing data form (unchanged behaviour) -----
    const myName = opts.employee?.name || user.name || '';
    $('md-name').textContent = myName || '—'; $('md-avatar').textContent = (myName || '?')[0];
    $('md-code').textContent = opts.employee?.id ?? user.id;
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
      say($('md-error'), '');
      const body = { entry_date: $('md-date').value, stage: $('md-stage').value, quantity: $('md-qty').value, reason_type: reason(), notes: $('md-notes').value };
      if (!body.entry_date) return void say($('md-error'), 'اختر التاريخ.');
      if (!body.stage) return void say($('md-error'), 'اختر المرحلة.');
      if (body.quantity === '' || !(Number(body.quantity) >= 0)) return void say($('md-error'), 'أدخل الكمية الفعلية.');
      submit.disabled = true;
      try {
        await api('/api/missing', { method: 'POST', body: JSON.stringify(body) });
        $('md-qty').value = ''; $('md-notes').value = '';
        showHint('info', 'تم إرسال الطلب للمشرف. ستصلك إشعارات بالقرار.');
        await loadMine();
      } catch (e) {
        say($('md-error'), e.message);
        if (e.data && (e.data.code === 'already_recorded' || e.data.code === 'duplicate' || e.data.code === 'not_recorded')) refreshHint();
      } finally { if (!state.pending && !(state.recorded && reason() === 'missing')) submit.disabled = false; }
    });

    // ----- leave form -----
    $('lv-types').innerHTML = Object.entries(lopts.leaveTypes).map(([k, v], i) => `<label><input type="radio" name="lv-type" value="${k}" ${i === 0 ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('');
    const leaveType = () => (document.querySelector('input[name="lv-type"]:checked') || {}).value;
    $('lv-start').min = lopts.window.min; $('lv-end').min = lopts.window.min;
    const showDays = () => {
      const a = $('lv-start').value, b = $('lv-end').value, box = $('lv-days');
      box.classList.remove('bad');
      if (!a || !b) { box.innerHTML = '<b>—</b><small>يوم</small>'; return; }
      const n = Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
      if (n < 1) { box.classList.add('bad'); box.innerHTML = '<b>!</b><small>تاريخ خاطئ</small>'; return; }
      box.innerHTML = `<b>${n}</b><small>${n === 1 ? 'يوم' : 'أيام'}</small>`;
    };
    $('lv-start').addEventListener('change', () => { if (!$('lv-end').value || $('lv-end').value < $('lv-start').value) $('lv-end').value = $('lv-start').value; $('lv-end').min = $('lv-start').value || lopts.window.min; showDays(); });
    $('lv-end').addEventListener('change', showDays);
    $('lv-submit').addEventListener('click', async () => {
      const err = $('lv-error'); say(err, '');
      const body = { kind: 'leave', leave_type: leaveType(), start_date: $('lv-start').value, end_date: $('lv-end').value, notes: $('lv-notes').value };
      if (!body.start_date || !body.end_date) return void say(err, 'اختر تاريخ البداية والنهاية.');
      if (body.end_date < body.start_date) return void say(err, 'تاريخ النهاية قبل تاريخ البداية.');
      setBtnBusy($('lv-submit'), true);
      try {
        await api('/api/requests', { method: 'POST', body: JSON.stringify(body) });
        $('lv-start').value = ''; $('lv-end').value = ''; $('lv-notes').value = ''; showDays();
        say(err, 'تم إرسال طلب الإجازة للمشرف. ستصلك إشعارات بالقرار.', true);
        await loadMine();
      } catch (e) { say(err, e.message); } finally { setBtnBusy($('lv-submit'), false); }
    });

    // ----- advance form -----
    $('ad-chips').addEventListener('click', e => { const c = e.target.closest('[data-amt]'); if (c) $('ad-amount').value = c.dataset.amt; });
    $('ad-submit').addEventListener('click', async () => {
      const err = $('ad-error'); say(err, '');
      const body = { kind: 'advance', amount: $('ad-amount').value, notes: $('ad-notes').value };
      if (!(Number(body.amount) > 0)) return void say(err, 'أدخل مبلغ السلفة.');
      if (!body.notes.trim()) return void say(err, 'اكتب سبب السلفة.');
      setBtnBusy($('ad-submit'), true);
      try {
        await api('/api/requests', { method: 'POST', body: JSON.stringify(body) });
        $('ad-amount').value = ''; $('ad-notes').value = '';
        say(err, 'تم إرسال طلب السلفة للمشرف. ستصلك إشعارات بالقرار.', true);
        await loadMine();
      } catch (e) { say(err, e.message); } finally { setBtnBusy($('ad-submit'), false); }
    });

    // ----- my requests (all kinds in one table) -----
    const ICON = {
      missing: ['tone-blue', '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"></path></svg>'],
      leave: ['tone-green', '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>'],
      advance: ['tone-amber', '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"></rect><circle cx="12" cy="12" r="2"></circle></svg>'],
    };
    async function loadMine() {
      const box = $('rq-cards');
      try {
        const [m, o] = await Promise.all([api('/api/missing/mine'), api('/api/requests/mine')]);
        const rows = [...m.requests.map(r => normalize(r, 'm')), ...o.requests.map(r => normalize(r, 'r'))].sort(byDate);
        box.innerHTML = rows.map(x => {
          const [tone, svg] = ICON[x.kind];
          const parts = x.detail.split('<span class="md-sub">');
          return `<div class="rq-card"><span class="rq-ico ${tone}">${svg}</span>
            <div class="rq-card-main"><span class="md-sub" style="margin:0 0 2px">${esc(KIND_LABEL[x.kind])}</span><b>${parts[0]}</b>${parts.slice(1).map(p => `<span class="md-sub">${p}`).join('')}${x.r.reviewed_by_name ? `<span class="md-sub">${esc(x.r.reviewed_by_name)} · ${fdt(x.r.reviewed_at)}</span>` : ''}${x.r.reject_reason ? `<span class="md-sub">السبب: ${esc(x.r.reject_reason)}</span>` : ''}</div>
            <div class="rq-card-side">${badge(x.r.status)}<time>${fdt(x.r.created_at)}</time>${x.r.status === 'pending' ? `<div class="md-row-actions"><button class="cancel" data-cancel="${x.key}">إلغاء الطلب</button></div>` : ''}</div></div>`;
        }).join('') || '<div class="rq-empty">لم تقدّم أي طلبات بعد.</div>';
      } catch (e) { box.innerHTML = `<div class="rq-empty">${esc(e.message)}</div>`; }
    }
    $('rq-cards').addEventListener('click', async e => {
      const b = e.target.closest('[data-cancel]'); if (!b) return;
      if (!confirm('إلغاء هذا الطلب؟')) return;
      const [src, id] = b.dataset.cancel.split(':');
      b.disabled = true;
      try { await api(`${apiBase(src)}/${id}/cancel`, { method: 'POST' }); } catch (err) { alert(err.message); }
      await loadMine(); refreshHint();
    });
    loadMine();
  }

  // ---------------- Reviewer ----------------
  function initReviewer() {
    $('md-desc').textContent = 'راجع طلبات الموظفين (استكمال بيانات، إجازات، سلف). عند اعتماد طلب استكمال البيانات فقط تُحدّث بيانات اليوم، ويُسجَّل كل قرار في سجل العمليات.';
    $('md-list-title').textContent = 'الطلبات';
    $('md-tabs').style.display = ''; $('md-kinds').style.display = '';
    $('md-thead').innerHTML = '<tr><th>الموظف</th><th>الشيفت</th><th>النوع</th><th>التفاصيل</th><th>الحالة</th><th>الإجراء</th></tr>';
    let status = 'pending', kind = 'all', rows = [], counts = {};
    const KINDS = [['all', 'الكل'], ['missing', 'استكمال بيانات'], ['leave', 'إجازات'], ['advance', 'سلف']];
    const TABS = [['pending', 'قيد المراجعة'], ['approved', 'معتمد'], ['rejected', 'مرفوض'], ['all', 'الكل']];
    function paintTabs() {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      $('md-tabs').innerHTML = TABS.map(([k, l]) => `<button data-tab="${k}" class="${k === status ? 'active' : ''}">${l}<b>${k === 'all' ? total : (counts[k] || 0)}</b></button>`).join('');
      $('md-kinds').innerHTML = KINDS.map(([k, l]) => `<button data-kind="${k}" class="${k === kind ? 'active' : ''}">${l}</button>`).join('');
    }
    const sumCounts = (...cs) => cs.reduce((a, c) => { Object.entries(c || {}).forEach(([k, v]) => { a[k] = (a[k] || 0) + v; }); return a; }, {});
    async function load() {
      try {
        const q = encodeURIComponent(status);
        const wantM = kind === 'all' || kind === 'missing';
        const wantR = kind !== 'missing';
        const [m, o] = await Promise.all([
          wantM ? api('/api/missing/review?status=' + q) : { requests: [], counts: {} },
          wantR ? api('/api/requests/review?status=' + q + (kind === 'all' ? '' : '&kind=' + kind)) : { requests: [], counts: {} },
        ]);
        rows = [...m.requests.map(r => normalize(r, 'm')), ...o.requests.map(r => normalize(r, 'r'))].sort(byDate);
        counts = sumCounts(m.counts, o.counts); paintTabs();
        $('md-tbody').innerHTML = rows.map(x => `<tr>
          <td>${esc(x.r.employee_name)}<span class="md-sub">ID ${esc(x.r.employee_id)}</span></td><td>${esc(x.r.shift || '—')}</td>
          <td>${kindBadge(x.kind)}</td><td>${x.detail}<span class="md-sub">قُدّم ${fdt(x.r.created_at)}</span></td>
          <td>${reviewCell(x.r)}</td>
          <td>${x.r.status === 'pending' ? `<div class="md-row-actions"><button class="ok" data-ok="${x.key}">اعتماد</button><button class="no" data-no="${x.key}">رفض</button></div>` : x.r.status === 'approved' ? `<div class="md-row-actions"><button class="undo" data-undo="${x.key}">تراجع عن الاعتماد</button></div>` : ''}</td></tr>`).join('')
          || '<tr><td colspan="6"><div class="empty-state">لا توجد طلبات.</div></td></tr>';
      } catch (e) { $('md-tbody').innerHTML = `<tr><td colspan="6"><div class="empty-state">${esc(e.message)}</div></td></tr>`; }
      if (window.__iemsRefreshNotifications) window.__iemsRefreshNotifications();
    }
    $('md-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; status = b.dataset.tab; load(); });
    $('md-kinds').addEventListener('click', e => { const b = e.target.closest('[data-kind]'); if (!b) return; kind = b.dataset.kind; load(); });

    let rejectRow = null;
    const modal = $('md-reject-modal');
    const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); rejectRow = null; };
    $('md-reject-close').onclick = closeModal; $('md-reject-cancel').onclick = closeModal;
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    $('md-reject-confirm').onclick = async () => {
      const reason = $('md-reject-reason').value.trim();
      if (!reason) { $('md-reject-error').textContent = 'اكتب سبب الرفض.'; return; }
      $('md-reject-confirm').disabled = true;
      try { await api(`${apiBase(rejectRow.src)}/${rejectRow.id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }); closeModal(); }
      catch (e) { $('md-reject-error').textContent = e.message; }
      finally { $('md-reject-confirm').disabled = false; }
      load();
    };
    const label = x => x.kind === 'missing' ? `${x.r.stage} — ${fd(x.r.entry_date)}` : x.kind === 'leave' ? `إجازة ${LEAVE[x.r.leave_type] || ''} ${fd(x.r.start_date)} → ${fd(x.r.end_date)}` : `سلفة ${num(x.r.amount)}`;
    $('md-tbody').addEventListener('click', async e => {
      const ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]'), undo = e.target.closest('[data-undo]');
      if (undo) {
        const x = rows.find(v => v.key === undo.dataset.undo); if (!x) return;
        const what = x.kind === 'missing' ? `\nسيتم إرجاع قيمة اليوم إلى ${x.r.old_value === null || x.r.old_value === undefined ? 'غير مسجل' : num(x.r.old_value)}.` : '';
        if (!confirm(`التراجع عن اعتماد: ${x.r.employee_name} — ${label(x)}${what}\nسيعود الطلب إلى "قيد المراجعة".`)) return;
        undo.disabled = true;
        try { await api(`${apiBase(x.src)}/${x.id}/revert`, { method: 'POST' }); } catch (err) { alert(err.message); }
        load();
      } else if (ok) {
        const x = rows.find(v => v.key === ok.dataset.ok); if (!x) return;
        let msg = `اعتماد: ${x.r.employee_name} — ${label(x)}`;
        if (x.kind === 'missing') msg += `\nالقيمة الحالية: ${x.r.current_value === null || x.r.current_value === undefined ? 'غير مسجل' : num(x.r.current_value)}  ←  الجديدة: ${num(x.r.quantity)}`;
        if (!confirm(msg)) return;
        ok.disabled = true;
        try { await api(`${apiBase(x.src)}/${x.id}/approve`, { method: 'POST' }); } catch (err) { alert(err.message); }
        load();
      } else if (no) {
        const x = rows.find(v => v.key === no.dataset.no); if (!x) return;
        rejectRow = x; $('md-reject-who').textContent = `${x.r.employee_name} — ${label(x)}`;
        $('md-reject-reason').value = ''; $('md-reject-error').textContent = '';
        modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
      }
    });
    load();
  }

  if (isEmployee) initEmployee(); else initReviewer();
})();
