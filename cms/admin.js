/* ============================================================
   ADMIN CONTROLLER (portable)  ·  config-driven
   Owns the content model; the editing UI is inline (inside the preview).
   Reads everything from CMS.config — no project knowledge here.
     • renders preview in edit mode (cms-render)
     • receives inline edits (cms-edit) and mutates data
     • autosaves to localStorage; Export to publish
     • hosts theme drawer + image/icon/add-section pickers
   ============================================================ */
(function(){
  const $=s=>document.querySelector(s);
  const ICONS=window.ICONS||{}, ICON_KEYS=window.ICON_KEYS||Object.keys(ICONS);
  const FONTS=['Space Grotesk','Plus Jakarta Sans','Inter','Poppins','Montserrat','Sora','Manrope','DM Sans','Outfit','Lexend'];
  let content = CMS.load();
  let pendingImg=null, pendingIcon=null, saveTimer=null, device='desktop';

  const SECTIONS=()=>CMS.config.sections||{};
  const IMAGES=()=>CMS.config.images||[];

  /* ---------- preview ---------- */
  const frame=()=>$('#previewFrame');
  function pushPreview(){ const f=frame(); if(f&&f.contentWindow) f.contentWindow.postMessage({type:'cms-render',content,edit:true},'*'); }
  function autosave(){ clearTimeout(saveTimer); setDirty(true); saveTimer=setTimeout(()=>{ if(CMS.save(content)) setDirty(false); },500); }
  function saveNow(){ if(CMS.save(content)) setDirty(false); }
  function setDirty(d){ const s=$('#saved'); if(!s)return; s.textContent=d?'● Menyimpan…':'✓ Tersimpan'; s.classList.toggle('dirty',d); }
  function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200); }

  /* ---------- inline-edit messages ---------- */
  window.addEventListener('message',e=>{
    const d=e.data; if(!d) return;
    if(d.type==='cms-frame-ready'){ pushPreview(); return; }
    if(d.type!=='cms-edit') return;
    if(d.op==='text'){ CMS.set(content,d.path,d.value); if(d.rerender) pushPreview(); autosave(); }
    else if(d.op==='image'){ pendingImg=d.path; openImg(); }
    else if(d.op==='icon'){ pendingIcon=d.path; openIcon(); }
    else if(d.op==='item'){ handleItem(d.action,d.path); }
    else if(d.op==='section'){ handleSection(d.action,d.idx); }
  });

  function handleItem(action,path){
    if(action==='add'){ const arr=CMS.get(content,path)||[]; arr.push(arr.length?CMS.clone(arr[arr.length-1]):'Teks baru'); CMS.set(content,path,arr); }
    else { const ks=CMS.parse(path), idx=ks.pop(), arr=ks.length?CMS.get(content,ks.join('.')):content; if(!Array.isArray(arr))return;
      if(action==='del') arr.splice(idx,1);
      else if(action==='up'&&idx>0)[arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]];
      else if(action==='down'&&idx<arr.length-1)[arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]]; }
    pushPreview(); autosave();
  }
  function handleSection(action,idx){
    const S=content.sections; if(!S||idx<0||idx>=S.length)return;
    if(action==='del') S.splice(idx,1);
    else if(action==='hide') S[idx].enabled=(S[idx].enabled===false);
    else if(action==='up'&&idx>0)[S[idx-1],S[idx]]=[S[idx],S[idx-1]];
    else if(action==='down'&&idx<S.length-1)[S[idx+1],S[idx]]=[S[idx],S[idx+1]];
    pushPreview(); autosave();
  }

  /* ---------- image picker ---------- */
  function openImg(){ const g=$('#imgGrid'); g.innerHTML='';
    const up=document.createElement('label'); up.className='upload'; up.innerHTML='⬆<span>Upload</span>';
    const fi=document.createElement('input'); fi.type='file'; fi.accept='image/*'; fi.style.display='none';
    fi.onchange=()=>{ if(fi.files[0]) handleUpload(fi.files[0],applyImg); }; up.appendChild(fi); g.appendChild(up);
    IMAGES().forEach(src=>{ const im=document.createElement('img'); im.src='../'+src; im.loading='lazy'; im.onclick=()=>applyImg(src); g.appendChild(im); });
    $('#imgModal').classList.add('open');
  }
  function applyImg(src){ if(pendingImg){ CMS.set(content,pendingImg,src); pushPreview(); autosave(); } closeImg(); toast('Gambar diganti'); }
  function closeImg(){ $('#imgModal').classList.remove('open'); pendingImg=null; }
  function handleUpload(file,cb){ const r=new FileReader();
    r.onload=()=>{ const img=new Image(); img.onload=()=>{ const max=1600; let w=img.width,h=img.height;
      if(w>max||h>max){ const s=Math.min(max/w,max/h); w=Math.round(w*s); h=Math.round(h*s); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(img,0,0,w,h);
      cb(cv.toDataURL('image/jpeg',.82)); }; img.src=r.result; }; r.readAsDataURL(file); }

  /* ---------- icon picker ---------- */
  function openIcon(){ const g=$('#iconGrid'); g.innerHTML='';
    ICON_KEYS.forEach(k=>{ const b=document.createElement('button'); b.innerHTML=`<svg viewBox="0 0 24 24">${ICONS[k]}</svg>`;
      b.onclick=()=>{ if(pendingIcon){ CMS.set(content,pendingIcon,k); pushPreview(); autosave(); } $('#iconModal').classList.remove('open'); pendingIcon=null; toast('Ikon diganti'); }; g.appendChild(b); });
    $('#iconModal').classList.add('open');
  }

  /* ---------- add section ---------- */
  function openAdd(){ const g=$('#addGrid'); g.innerHTML='';
    Object.keys(SECTIONS()).filter(t=>!SECTIONS()[t].chrome).forEach(type=>{ const def=SECTIONS()[type];
      const b=document.createElement('button'); b.innerHTML=`<span class="em">${def.icon||'▫'}</span><span class="nm">${def.label||type}</span><small>${type}</small>`;
      b.onclick=()=>addSection(type); g.appendChild(b); });
    $('#addModal').classList.add('open');
  }
  function addSection(type){
    const seed=(CMS.config.defaultContent.sections||[]).find(s=>s.type===type);
    const data=seed?CMS.clone(seed.data):{};
    content.sections.push({id:'sec-'+type+'-'+Math.floor(performance.now()),type,enabled:true,data});
    $('#addModal').classList.remove('open'); pushPreview(); autosave(); toast('Section "'+(SECTIONS()[type].label||type)+'" ditambahkan');
    setTimeout(()=>{ const f=frame(); if(f) f.contentWindow.scrollTo(0,f.contentWindow.document.body.scrollHeight); },300);
  }

  /* ---------- theme drawer ---------- */
  function buildTheme(){ const body=$('#themeBody'); body.innerHTML='';
    const colorRow=(label,key)=>{ const w=document.createElement('div'); w.className='field'; w.innerHTML=`<label>${label}</label>`;
      const row=document.createElement('div'); row.className='colorrow';
      const c=document.createElement('input'); c.type='color'; c.value=content.theme.colors[key]||'#000000';
      const t=document.createElement('input'); t.type='text'; t.value=content.theme.colors[key]||'';
      c.oninput=()=>{ content.theme.colors[key]=c.value; t.value=c.value; pushPreview(); autosave(); };
      t.oninput=()=>{ content.theme.colors[key]=t.value; if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t.value))c.value=t.value; pushPreview(); autosave(); };
      row.append(c,t); w.appendChild(row); return w; };
    Object.keys(content.theme.colors||{}).forEach(k=>body.appendChild(colorRow(k,k)));
    const fontSel=(label,key)=>{ const w=document.createElement('div'); w.className='field'; w.innerHTML=`<label>${label}</label>`;
      const s=document.createElement('select'); FONTS.forEach(f=>{ const o=document.createElement('option'); o.value=f; o.textContent=f; if(content.theme.fonts[key]===f)o.selected=true; s.appendChild(o); });
      s.onchange=()=>{ content.theme.fonts[key]=s.value; pushPreview(); autosave(); }; w.appendChild(s); return w; };
    body.appendChild(fontSel('Font Judul','heading')); body.appendChild(fontSel('Font Teks','body'));
    const rw=document.createElement('div'); rw.className='field'; rw.innerHTML=`<label>Kelengkungan sudut: ${content.theme.radius}px</label>`;
    const rg=document.createElement('input'); rg.type='range'; rg.min=4; rg.max=28; rg.value=content.theme.radius; rg.style.width='100%';
    rg.oninput=()=>{ content.theme.radius=+rg.value; rw.querySelector('label').textContent='Kelengkungan sudut: '+rg.value+'px'; pushPreview(); autosave(); };
    rw.appendChild(rg); body.appendChild(rw);
  }
  function openTheme(){ buildTheme(); $('#themeDrawer').classList.add('open'); $('#backdrop').classList.add('show'); }
  function closeTheme(){ $('#themeDrawer').classList.remove('open'); $('#backdrop').classList.remove('show'); }

  /* ---------- toolbar ---------- */
  function wire(){
    $('#btnTheme').onclick=openTheme; $('#themeClose').onclick=closeTheme; $('#backdrop').onclick=closeTheme;
    $('#btnAddSec').onclick=openAdd; $('#addClose').onclick=()=>$('#addModal').classList.remove('open');
    $('#imgClose').onclick=closeImg; $('#imgModal').onclick=e=>{ if(e.target===$('#imgModal'))closeImg(); };
    $('#iconClose').onclick=()=>$('#iconModal').classList.remove('open'); $('#iconModal').onclick=e=>{ if(e.target===$('#iconModal'))$('#iconModal').classList.remove('open'); };
    $('#addModal').onclick=e=>{ if(e.target===$('#addModal'))$('#addModal').classList.remove('open'); };
    $('#btnExport').onclick=()=>{ saveNow(); CMS.exportJSON(content); toast('content.json diunduh — upload untuk publish'); };
    $('#btnImport').onclick=()=>$('#importFile').click();
    $('#importFile').onchange=async e=>{ if(e.target.files[0]){ try{ content=await CMS.importJSON(e.target.files[0]); pushPreview(); saveNow(); toast('Konten di-import'); }catch(err){ toast('File tidak valid'); } } };
    $('#btnReset').onclick=()=>{ if(confirm('Kembalikan ke konten default? Perubahan yang belum di-export hilang.')){ content=CMS.reset(); pushPreview(); setDirty(false); toast('Direset ke default'); } };
    $('#btnSite').onclick=()=>window.open('../index.html','_blank');
    document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{ device=b.dataset.dev; document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('active',x===b)); $('#stage').classList.toggle('phone',device==='phone'); });
    window.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='s'){ e.preventDefault(); saveNow(); toast('Tersimpan'); } });
  }

  function boot(){ wire(); const f=frame(); f.addEventListener('load',()=>setTimeout(pushPreview,80)); [120,400,800,1500].forEach(t=>setTimeout(pushPreview,t)); }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
