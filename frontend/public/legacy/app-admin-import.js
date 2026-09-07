const token = sessionStorage.getItem('iems_token');
const userRaw = sessionStorage.getItem('iems_user');
if (!token || !userRaw) window.location.href = '/index.html';
const user = JSON.parse(userRaw);
if (user.role !== 'admin' && user.role !== 'supervisor') window.location.href = '/home.html';
const $ = id => document.getElementById(id);
function authHeaders(){return {Authorization:'Bearer '+token,'Content-Type':'application/json'}};
async function api(path,opts={}){const res=await fetch(path,{...opts,headers:{...authHeaders(),...(opts.headers||{})}});if(res.status===401){sessionStorage.clear();location.href='/index.html';throw new Error('انتهت الجلسة')}const data=await res.json();if(!res.ok)throw new Error(data.error||'حدث خطأ');return data}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('chip-name').textContent=user.name;$('chip-role').textContent=`ID: ${user.id} · ${user.role==='admin'?'مدير النظام':'مشرف'}`;$('chip-avatar').textContent=(user.name||'?').trim()[0]||'?';$('logout-btn').onclick=()=>{sessionStorage.clear();location.href='/index.html'};
const savedTheme=localStorage.getItem('iems-theme')||'light';document.documentElement.dataset.theme=savedTheme;
function themeIcon(){if(!$('theme-toggle'))return;$('theme-toggle').innerHTML=document.documentElement.dataset.theme==='dark'?'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>';}
$('theme-toggle').onclick=()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('iems-theme',n);themeIcon()};themeIcon();
const file=$('master-file');const selected=$('selected-file');const dropzone=$('import-dropzone');
if(importMonthEl&&!importMonthEl.value){const d=new Date();importMonthEl.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`} 

// Multiple Master files can be selected/dropped together (e.g. Shift A +
// Shift B + Shift C in one go). We keep our own working list of files
// (rather than relying only on file.files) so drag-and-drop and the native
// picker both funnel into the same array, and so a file can be removed
// from the selection before uploading.
let selectedFiles=[];

function formatSize(bytes){return (bytes/1024/1024).toFixed(2)+' MB'}

function renderSelectedFiles(){
  if(!selectedFiles.length){selected.style.display='none';selected.innerHTML='';return}
  selected.style.display='block';
  selected.innerHTML=selectedFiles.map((f,i)=>`<div class="selected-file-row" data-i="${i}"><span class="selected-file-name">${esc(f.name)}</span><span class="selected-file-size">${formatSize(f.size)}</span><button type="button" class="selected-file-remove" data-i="${i}" title="إزالة الملف" aria-label="إزالة الملف">×</button></div>`).join('');
  selected.querySelectorAll('.selected-file-remove').forEach(btn=>{
    btn.onclick=()=>{const i=Number(btn.dataset.i);selectedFiles.splice(i,1);renderSelectedFiles()};
  });
}

function addFiles(fileList){
  if(!fileList||!fileList.length)return;
  const incoming=[...fileList].filter(f=>/\.xlsx$/i.test(f.name));
  const skippedNonXlsx=fileList.length-incoming.length;
  // Avoid adding the exact same file twice (same name + size).
  for(const f of incoming){
    if(!selectedFiles.some(existing=>existing.name===f.name&&existing.size===f.size)){
      selectedFiles.push(f);
    }
  }
  renderSelectedFiles();
  const status=$('master-upload-status');
  if(skippedNonXlsx>0){status.className='upload-status error';status.textContent=`تم تجاهل ${skippedNonXlsx} ملف/ملفات لأنها ليست بصيغة XLSX.`}
  else if(status.classList.contains('error')){status.className='upload-status';status.textContent=''}
}

file.onchange=()=>{addFiles(file.files);file.value=''};

// Drag & drop: the whole dropzone box accepts dragged-over files, in
// addition to the native click-to-browse behavior from the <label for>.
;['dragenter','dragover'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();e.stopPropagation();dropzone.classList.add('drag-over')}));
;['dragleave','drop'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();e.stopPropagation();dropzone.classList.remove('drag-over')}));
dropzone.addEventListener('drop',e=>{const dt=e.dataTransfer;if(!dt||!dt.files||!dt.files.length)return;addFiles(dt.files)});
function readAsDataUrl(f){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error(`تعذّر قراءة الملف "${f.name}".`));r.readAsDataURL(f)})}


async function loadImportHistory(){
  const body=$('import-history-body');
  if(!body)return;
  try{
    const data=await api('/api/admin/import-history');
    const rows=data.history||[];
    body.innerHTML=rows.length?rows.map(h=>`<tr><td>${esc(new Date(h.created_at).toLocaleString('ar-EG'))}</td><td>${esc(h.imported_by_name||('ID '+(h.imported_by??'—')))}</td><td>${esc(h.month_start?String(h.month_start).slice(0,7):'—')}</td><td>${esc(h.filename||'Master.xlsx')}</td><td>${Number(h.updated_count||0).toLocaleString('en-US')}</td><td>${Number(h.created_count||0).toLocaleString('en-US')}</td><td>${Number(h.daily_count||0).toLocaleString('en-US')}</td><td><span class="status-badge status-active">${esc(h.status==='success'?'نجح':'فشل')}</span></td></tr>`).join(''):'<tr><td colspan="8"><div class="empty-state">لا توجد عمليات Import حتى الآن.</div></td></tr>';
  }catch(e){body.innerHTML=`<tr><td colspan="8"><div class="empty-state">تعذر تحميل سجل الاستيراد: ${esc(e.message)}</div></td></tr>`}
}
loadImportHistory();

$('master-upload-btn').onclick=async()=>{
  const status=$('master-upload-status');
  if(!importMonth){status.className='upload-status error';status.textContent='يرجى اختيار شهر البيانات أولاً.';return}
  if(!selectedFiles.length){status.className='upload-status error';status.textContent='يرجى اختيار ملف Excel واحد على الأقل قبل المتابعة.';return}
  for(const f of selectedFiles){
    if(f.size>8*1024*1024){status.className='upload-status error';status.textContent=`حجم الملف "${f.name}" يتجاوز الحد المسموح به (8 ميغابايت).`;return}
  }

  const btn=$('master-upload-btn');btn.disabled=true;
  const queue=[...selectedFiles];
  const combined={updatedEmployees:[],createdEmployees:[],daily:0};
  const perFileResults=[];
  let lastFileName='';

  try{
    for(let i=0;i<queue.length;i++){
      const f=queue[i];
      lastFileName=f.name;
      status.className='upload-status';
      status.textContent=`جارٍ تحديث البيانات: ملف ${i+1} من ${queue.length} (${f.name})...`;
      try{
        const dataUrl=await readAsDataUrl(f);
        const data=await api('/api/admin/import-master',{method:'POST',body:JSON.stringify({filename:f.name,data:String(dataUrl),merge:queue.length>1})});
        combined.updatedEmployees.push(...(data.updatedEmployees||[]));
        combined.createdEmployees.push(...(data.createdEmployees||[]));
        combined.daily+=data.daily||0;
        perFileResults.push({fileName:f.name,ok:true,message:data.message||'تم بنجاح.'});
      }catch(e){
        perFileResults.push({fileName:f.name,ok:false,message:e.message||'فشل التحديث.'});
      }
    }

    await loadImportHistory();

    const failed=perFileResults.filter(r=>!r.ok);
    const succeeded=perFileResults.filter(r=>r.ok);
    if(!failed.length){
      status.className='upload-status success';
      status.textContent=queue.length>1?`تم تحديث ${queue.length} ملفات بنجاح.`:(perFileResults[0]?.message||'تم تحديث البيانات بنجاح.');
    }else if(succeeded.length){
      status.className='upload-status error';
      status.textContent=`تم تحديث ${succeeded.length} من ${queue.length} ملفات. فشل: ${failed.map(r=>`${r.fileName} (${r.message})`).join('، ')}`;
    }else{
      status.className='upload-status error';
      status.textContent=`تعذّر تحديث أي ملف. ${failed.map(r=>`${r.fileName}: ${r.message}`).join('، ')}`;
    }

    selectedFiles=[];file.value='';renderSelectedFiles();
  }finally{
    btn.disabled=false;
  }
};
