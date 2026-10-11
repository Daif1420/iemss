// "الموظفون المغادرون" page: filters (date range, departure reason, shift,
// company, department) + Excel / PDF export of the currently filtered list.
// Works together with app-employee-groups.js, which exposes:
//   window.__groupRows()   -> all rows loaded for the page
//   window.__groupView     -> rows currently shown (after search + filters)
//   window.__renderGroup() -> re-render the table
//   window.__groupFilter   -> optional extra row predicate (set here)
(() => {
  const panel = document.getElementById('left-filters');
  if (!panel) return; // not the "left" page
  const $ = id => document.getElementById(id);
  const ALL = '__ALL__', NONE = '__NONE__';
  const fields = { from: $('lf-from'), to: $('lf-to'), reason: $('lf-reason'), shift: $('lf-shift'), company: $('lf-company'), department: $('lf-department') };

  const day = v => (v ? String(v).slice(0, 10) : '');
  const fd = v => (v ? day(v).split('-').reverse().join('/') : '—');
  const val = v => (v === null || v === undefined || v === '' ? '' : String(v));

  function fillSelect(sel, values, noneLabel) {
    const keep = sel.value;
    const opts = [`<option value="${ALL}">الكل</option>`];
    if (noneLabel) opts.push(`<option value="${NONE}">${noneLabel}</option>`);
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    for (const v of values) opts.push(`<option value="${esc(v)}">${esc(v)}</option>`);
    sel.innerHTML = opts.join('');
    sel.value = [...sel.options].some(o => o.value === keep) ? keep : ALL;
  }

  const distinct = (rows, key) => [...new Set(rows.map(r => val(r[key]).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'));

  function populate() {
    const rows = window.__groupRows ? window.__groupRows() : [];
    fillSelect(fields.reason, distinct(rows, 'departure_reason'), 'بدون سبب مسجل');
    fillSelect(fields.shift, distinct(rows, 'shift'));
    fillSelect(fields.company, distinct(rows, 'company'));
    fillSelect(fields.department, distinct(rows, 'department'));
    panel.style.display = '';
  }

  function matchSelect(sel, value) {
    if (sel.value === ALL) return true;
    if (sel.value === NONE) return !val(value).trim();
    return val(value).trim() === sel.value;
  }

  window.__groupFilter = e => {
    const d = day(e.left_date);
    if (fields.from.value && (!d || d < fields.from.value)) return false;
    if (fields.to.value && (!d || d > fields.to.value)) return false;
    return matchSelect(fields.reason, e.departure_reason)
      && matchSelect(fields.shift, e.shift)
      && matchSelect(fields.company, e.company)
      && matchSelect(fields.department, e.department);
  };

  const rerender = () => { if (window.__renderGroup) window.__renderGroup(); };
  Object.values(fields).forEach(el => { el.addEventListener('change', rerender); el.addEventListener('input', rerender); });
  $('lf-reset').addEventListener('click', () => {
    fields.from.value = ''; fields.to.value = '';
    [fields.reason, fields.shift, fields.company, fields.department].forEach(s => { s.value = ALL; });
    const search = $('group-search'); if (search) search.value = '';
    rerender();
  });

  window.addEventListener('group-loaded', populate);
  if (window.__groupRows) populate();

  // ---------- export ----------
  const HEAD = ['م', 'الاسم', 'ID', 'الشركة', 'القسم', 'الشيفت', 'الفئة', 'تاريخ المغادرة', 'سبب المغادرة'];
  const view = () => (window.__groupView || []);
  const toRow = (e, i) => [i + 1, val(e.name), val(e.id), val(e.company), val(e.department), val(e.shift), val(e.education), fd(e.left_date) === '—' ? '' : fd(e.left_date), val(e.departure_reason)];
  const stamp = () => new Date().toISOString().slice(0, 10);

  function filterSummary() {
    const parts = [];
    if (fields.from.value || fields.to.value) parts.push(`المغادرة: ${fields.from.value ? fd(fields.from.value) : '…'} إلى ${fields.to.value ? fd(fields.to.value) : '…'}`);
    const pick = (sel, label) => { if (sel.value === NONE) parts.push(`${label}: بدون`); else if (sel.value !== ALL) parts.push(`${label}: ${sel.value}`); };
    pick(fields.reason, 'السبب'); pick(fields.shift, 'الشيفت'); pick(fields.company, 'الشركة'); pick(fields.department, 'القسم');
    const q = ($('group-search') || {}).value;
    if (q && q.trim()) parts.push(`بحث: ${q.trim()}`);
    return parts.join(' — ') || 'بدون فلاتر';
  }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  function exportExcel() {
    const rows = view();
    if (!rows.length) { alert('لا توجد بيانات للتصدير.'); return; }
    const data = rows.map(toRow);
    if (window.XLSX) {
      const ws = XLSX.utils.aoa_to_sheet([HEAD, ...data]);
      ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 34 }];
      const wb = XLSX.utils.book_new();
      wb.Workbook = { Views: [{ RTL: true }] };
      XLSX.utils.book_append_sheet(wb, ws, 'المغادرون');
      XLSX.writeFile(wb, `iems-left-employees_${stamp()}.xlsx`);
      return;
    }
    const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Left"><Table>${[HEAD, ...data].map(r => '<Row>' + r.map(v => `<Cell><Data ss:Type="${typeof v === 'number' ? 'Number' : 'String'}">${esc(v)}</Data></Cell>`).join('') + '</Row>').join('')}</Table></Worksheet></Workbook>`;
    download(new Blob([xml], { type: 'application/vnd.ms-excel' }), `iems-left-employees_${stamp()}.xls`);
  }

  const escHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function pageHtml(chunk, startIndex, pageNo, pages, total) {
    const th = 'style="background:#1f2937;color:#fff;padding:8px 6px;border:1px solid #1f2937;font-size:12px"';
    const td = 'style="padding:7px 6px;border:1px solid #d1d5db;font-size:12px;text-align:center"';
    const tdName = 'style="padding:7px 8px;border:1px solid #d1d5db;font-size:12px;text-align:right"';
    return `<div class="lp-page" dir="rtl" style="width:1100px;box-sizing:border-box;padding:28px 32px;background:#fff;color:#111827;font-family:Cairo,Tahoma,Arial,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div><div style="font-size:22px;font-weight:900">تقرير الموظفين المغادرين</div><div style="font-size:12px;color:#6b7280;margin-top:4px">تاريخ التقرير: ${fd(stamp())} — الإجمالي: ${total}</div></div>
        <img src="/logo-report.png" alt="" style="height:42px;object-fit:contain">
      </div>
      <div style="font-size:12px;color:#374151;background:#f3f4f6;border-radius:8px;padding:8px 12px;margin:10px 0 14px">الفلاتر: ${escHtml(filterSummary())}</div>
      <table style="width:100%;border-collapse:collapse"><thead><tr>${HEAD.map(h => `<th ${th}>${h}</th>`).join('')}</tr></thead><tbody>
      ${chunk.map((e, i) => { const r = toRow(e, startIndex + i); return `<tr>${r.map((v, c) => `<td ${c === 1 || c === 8 ? tdName : td}>${escHtml(v) || '—'}</td>`).join('')}</tr>`; }).join('')}
      </tbody></table>
      <div style="text-align:center;font-size:11px;color:#6b7280;margin-top:12px">صفحة ${pageNo} من ${pages}</div>
    </div>`;
  }

  async function exportPdf() {
    const rows = view();
    if (!rows.length) { alert('لا توجد بيانات للتصدير.'); return; }
    if (!window.html2canvas || !window.jspdf) { alert('تعذر تحميل مكتبة PDF. تأكد من الاتصال بالإنترنت ثم أعد المحاولة.'); return; }
    const btn = $('lf-pdf'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'جاري إنشاء PDF...';
    const root = $('left-print-root');
    try {
      const PER_PAGE = 22;
      const pages = Math.ceil(rows.length / PER_PAGE);
      root.innerHTML = Array.from({ length: pages }, (_, p) => pageHtml(rows.slice(p * PER_PAGE, (p + 1) * PER_PAGE), p * PER_PAGE, p + 1, pages, rows.length)).join('');
      const imgs = [...root.querySelectorAll('img')];
      await Promise.all(imgs.map(im => im.complete ? null : new Promise(r => { im.onload = r; im.onerror = r; })));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight(), m = 6;
      const els = [...root.querySelectorAll('.lp-page')];
      for (let i = 0; i < els.length; i++) {
        const canvas = await html2canvas(els[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
        let w = W - m * 2, h = (canvas.height * w) / canvas.width;
        if (h > H - m * 2) { h = H - m * 2; w = (canvas.width * h) / canvas.height; }
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (W - w) / 2, m, w, h);
      }
      pdf.save(`iems-left-employees_${stamp()}.pdf`);
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء ملف PDF: ' + (err && err.message ? err.message : err));
    } finally {
      root.innerHTML = ''; btn.disabled = false; btn.textContent = label;
    }
  }

  $('lf-excel').addEventListener('click', exportExcel);
  $('lf-pdf').addEventListener('click', exportPdf);
})();
