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
  const AUTH_KEY='cms_admin_auth_v1';
  const isSectionTarget=t=>/^#sec-/.test(String(t||''));
  const slug=v=>String(v||'section').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'section';

  function ensureSectionIds(){
    const used={};
    (content.sections||[]).forEach((s,i)=>{
      let base=slug(s.id || ('sec-'+(s.type||'section')+'-'+(i+1)));
      if(!base.startsWith('sec-')) base='sec-'+base;
      let id=base, n=2;
      while(used[id]) id=base+'-'+(n++);
      used[id]=1; s.id=id;
    });
  }
  function sectionTitle(s,i){
    const def=SECTIONS()[s.type]||{};
    const title=(s.data&&(s.data.navLabel||s.data.eyebrow||s.data.title))||def.label||s.type||('Section '+(i+1));
    return String(title).trim()||('Section '+(i+1));
  }
  function optionTitle(s,i){
    const def=SECTIONS()[s.type]||{};
    const label=def.label||s.type||('Section '+(i+1));
    const anchor='#'+String(s.id||'').replace(/^sec-/,'');
    return label+' - '+anchor;
  }
  function sectionOptions(includeHidden){
    ensureSectionIds();
    return (content.sections||[])
      .map((s,i)=>({target:'#'+s.id,label:sectionTitle(s,i),option:optionTitle(s,i),hidden:s.enabled===false}))
      .filter(o=>includeHidden||!o.hidden);
  }
  function syncNavLinks(){
    ensureSectionIds();
    if(!content.nav) content.nav={links:[]};
    if(!Array.isArray(content.nav.links)) content.nav.links=[];
    const valid=new Set(sectionOptions(true).map(o=>o.target));
    content.nav.links=content.nav.links
      .filter(l=>l&&l.target)
      .filter(l=>!isSectionTarget(l.target)||valid.has(l.target));
  }
  syncNavLinks();

  /* ---------- clean line-icon set (no emoji) ---------- */
  const I = {
    add:'<path d="M12 5v14M5 12h14"/>',
    theme:'<circle cx="13.5" cy="6.5" r="1.3"/><circle cx="17.5" cy="10.5" r="1.3"/><circle cx="6.5" cy="12.5" r="1.3"/><circle cx="8.5" cy="7.5" r="1.3"/><path d="M12 2a10 10 0 100 20c1.1 0 1.8-.9 1.8-1.9 0-1.2-1-1.7-1-2.6 0-.7.6-1.3 1.4-1.3H16a6 6 0 006-6c0-4.9-4.5-8.2-10-8.2z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z"/>',
    importr:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    reset:'<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/>',
    export:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" transform="rotate(180 12 12)"/>',
    site:'<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>',
    desktop:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    tablet:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 17h2"/>',
    phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    publish:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/>',
    close:'<path d="M18 6L6 18M6 6l12 12"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff:'<path d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2M7.1 7.1C3.8 9.1 2 12 2 12s4 7 10 7c1.7 0 3.2-.5 4.5-1.2M14.2 5.3A10.4 10.4 0 0122 12s-1.2 2.1-3.4 4"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 3v18h-7"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    link:'<path d="M10 13a5 5 0 007.1 0l2-2a5 5 0 00-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 00-7.1 0l-2 2a5 5 0 007.1 7.1l1.1-1.1"/>',
    // section types
    hero:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M7 14h6M7 17h9"/>',
    stats:'<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6"/><rect x="12" y="7" width="3" height="10"/><rect x="17" y="13" width="3" height="4"/>',
    services:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    why:'<path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1-6.3-4.6L5.7 21l2.3-7.1-6-4.5h7.6z"/>',
    process:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    segments:'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="16" y="4" width="5" height="16" rx="1"/>',
    gallery:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    testimonials:'<path d="M21 11.5a8.4 8.4 0 01-9 8.4 9 9 0 01-4-1L3 20l1.1-4.9a8.4 8.4 0 01-1-4A8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z"/>',
    cta:'<path d="M3 11l18-5v12L3 14v-3zM11.6 16.8A3 3 0 017 17"/><path d="M3 11v3"/>',
    header:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
    footer:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/>',
    generic:'<rect x="3" y="3" width="18" height="18" rx="2"/>',
  };
  const uiSvg = (name,sz) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${sz||16}" height="${sz||16}">${I[name]||I.generic}</svg>`;
  const secSvg = type => uiSvg(I[type]?type:'generic', 24);

  /* ---------- preview ---------- */
  const frame=()=>$('#previewFrame');
  function pushPreview(){ const f=frame(); if(f&&f.contentWindow) f.contentWindow.postMessage({type:'cms-render',content,edit:true},'*'); }
  function hideStatus(){ const s=$('#saved'); if(!s)return; s.textContent=''; s.classList.remove('show','dirty'); }
  function showPublished(){ const s=$('#saved'); if(!s)return; s.textContent='Terpublish'; s.classList.add('show'); s.classList.remove('dirty'); }
  function autosave(){ clearTimeout(saveTimer); hideStatus(); saveTimer=setTimeout(()=>{ CMS.save(content); },500); }
  function saveNow(){ hideStatus(); return CMS.save(content); }
  function setDirty(){ hideStatus(); }
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
    syncNavLinks();
    pushPreview(); autosave();
    if($('#setDrawer').classList.contains('open')) buildSettings();
  }

  /* ---------- image picker ---------- */
  function openImg(){ const g=$('#imgGrid'); g.innerHTML='';
    const up=document.createElement('label'); up.className='upload'; up.innerHTML='⬆<span>Upload</span>';
    const fi=document.createElement('input'); fi.type='file'; fi.accept='image/*'; fi.style.display='none';
    fi.onchange=()=>{ if(fi.files[0]) handleUpload(fi.files[0],applyImg); }; up.appendChild(fi); g.appendChild(up);
    IMAGES().forEach(src=>{ const im=document.createElement('img'); im.src='../'+src; im.loading='lazy'; im.onclick=()=>applyImg(src); g.appendChild(im); });
    $('#imgModal').classList.add('open');
  }
  function applyImg(src){ if(pendingImg){ CMS.set(content,pendingImg,src); pushPreview(); autosave(); if($('#setDrawer').classList.contains('open')) buildSettings(); } closeImg(); toast('Gambar diganti'); }
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
      const b=document.createElement('button'); b.innerHTML=`<span class="em">${secSvg(type)}</span><span class="nm">${def.label||type}</span><small>${type}</small>`;
      b.onclick=()=>addSection(type); g.appendChild(b); });
    $('#addModal').classList.add('open');
  }
  function addSection(type){
    const seed=(CMS.config.defaultContent.sections||[]).find(s=>s.type===type);
    const data=seed?CMS.clone(seed.data):{};
    content.sections.push({id:'sec-'+type+'-'+Math.floor(performance.now()),type,enabled:true,data});
    syncNavLinks();
    $('#addModal').classList.remove('open'); pushPreview(); autosave(); toast('Section "'+(SECTIONS()[type].label||type)+'" ditambahkan');
    if($('#setDrawer').classList.contains('open')) buildSettings();
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
  function openTheme(){ buildTheme(); closeDrawers(); $('#themeDrawer').classList.add('open'); $('#backdrop').classList.add('show'); }
  function closeDrawers(){ $('#themeDrawer').classList.remove('open'); $('#setDrawer').classList.remove('open'); $('#backdrop').classList.remove('show'); }

  /* ---------- settings drawer (non-inline fields: logo, WA, SEO) ---------- */
  function settingGroups(){
    const raw=CMS.config.settings||[];
    if(!raw.length) return [];
    return raw.some(s=>s.type==='group') ? raw : [{type:'group',title:'Pengaturan',fields:raw}];
  }
  function buildNavEditor(){
    syncNavLinks();
    const wrap=document.createElement('div'); wrap.className='nav-editor';
    const opts=sectionOptions(true);
    const links=content.nav.links;
    if(!opts.length){
      const empty=document.createElement('div'); empty.className='nav-empty'; empty.textContent='Belum ada section untuk dijadikan target menu.';
      wrap.appendChild(empty);
      return wrap;
    }
    const saveNav=()=>{ syncNavLinks(); pushPreview(); autosave(); };
    const makeSelect=(link, input)=>{
      const select=document.createElement('select');
      const current=link.target||opts[0].target;
      const currentKnown=opts.some(o=>o.target===current);
      if(!currentKnown){
        const custom=document.createElement('option'); custom.value=current; custom.textContent=current+' (custom)'; select.appendChild(custom);
      }
      opts.forEach(o=>{
        const option=document.createElement('option');
        option.value=o.target;
        option.textContent=o.option+(o.hidden?' (sembunyi)':'');
        if(o.target===current) option.selected=true;
        select.appendChild(option);
      });
      select.onchange=()=>{
        const old=opts.find(o=>o.target===link.target);
        const next=opts.find(o=>o.target===select.value);
        const oldLabel=(input.value||'').trim();
        link.target=select.value;
        if(next&&(!oldLabel||(old&&oldLabel===old.label))){
          link.label=next.label;
          input.value=next.label;
        }
        saveNav();
      };
      return select;
    };
    links.forEach((link,i)=>{
      const row=document.createElement('div'); row.className='nav-row';
      const labelField=document.createElement('div'); labelField.className='field';
      labelField.innerHTML='<label>Label menu</label>';
      const input=document.createElement('input'); input.type='text'; input.value=link.label||''; input.placeholder='Contoh: Layanan';
      input.oninput=()=>{ link.label=input.value; saveNav(); };
      labelField.appendChild(input);

      const targetField=document.createElement('div'); targetField.className='field';
      targetField.innerHTML='<label>Target section</label>';
      targetField.appendChild(makeSelect(link,input));

      const del=document.createElement('button'); del.className='tbtn ghost nav-delete'; del.title='Hapus menu'; del.innerHTML=uiSvg('trash')+'<span>Hapus menu</span>';
      del.onclick=()=>{ links.splice(i,1); saveNav(); buildSettings(); };
      row.append(labelField,targetField,del);
      wrap.appendChild(row);
    });
    const actions=document.createElement('div'); actions.className='nav-actions';
    const add=document.createElement('button'); add.className='tbtn'; add.innerHTML=uiSvg('add')+'<span>Tambah menu</span>';
    add.onclick=()=>{
      const used=new Set(links.map(l=>l.target));
      const pick=opts.find(o=>!o.hidden&&!used.has(o.target))||opts.find(o=>!o.hidden)||opts[0];
      links.push({label:pick.label,target:pick.target});
      saveNav(); buildSettings();
    };
    const sync=document.createElement('button'); sync.className='tbtn ghost'; sync.innerHTML=uiSvg('link')+'<span>Ikuti section aktif</span>';
    sync.onclick=()=>{
      content.nav.links=sectionOptions(false).map(o=>({label:o.label,target:o.target}));
      saveNav(); buildSettings();
    };
    actions.append(add,sync);
    wrap.appendChild(actions);
    return wrap;
  }
  function buildField(s){
    const w=document.createElement('div'); w.className='field setting-field';
    const label=document.createElement('label'); label.textContent=s.label||s.key; w.appendChild(label);
    if(s.help){ const help=document.createElement('p'); help.className='help'; help.textContent=s.help; w.appendChild(help); }
    if(s.type==='image'){
      const box=document.createElement('div'); box.className='imgfield';
      const cur=CMS.get(content,s.key);
      if(cur){
        const im=document.createElement('img'); im.className='thumb';
        im.src=/^(data:|https?:|blob:)/.test(cur) ? cur : '../'+cur.replace(/^\.\.\//,'');
        im.alt='Preview logo'; box.appendChild(im);
      } else {
        const empty=document.createElement('div'); empty.className='thumb empty-thumb';
        empty.innerHTML=uiSvg('image',22)+'<span>Logo default aktif</span>'; box.appendChild(empty);
      }
      const acts=document.createElement('div'); acts.className='imgacts';
      const pick=document.createElement('button'); pick.className='tbtn'; pick.innerHTML=uiSvg('image')+'<span>Pilih / Upload</span>';
      pick.onclick=()=>{ pendingImg=s.key; openImg(); };
      const clr=document.createElement('button'); clr.className='tbtn ghost'; clr.innerHTML=uiSvg('close')+'<span>Hapus</span>';
      clr.onclick=()=>{ CMS.set(content,s.key,''); pushPreview(); autosave(); buildSettings(); };
      acts.append(pick,clr); box.appendChild(acts); w.appendChild(box);
    } else if(s.type==='color') {
      const row=document.createElement('div'); row.className='setting-color';
      const color=document.createElement('input'); color.type='color';
      const text=document.createElement('input'); text.type='text';
      const value=CMS.get(content,s.key)||'#000000';
      color.value=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#000000';
      text.value=value;
      const update=v=>{ CMS.set(content,s.key,v); if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) color.value=v; pushPreview(); autosave(); };
      color.oninput=()=>{ text.value=color.value; update(color.value); };
      text.oninput=()=>update(text.value);
      row.append(color,text); w.appendChild(row);
    } else if(s.type==='navLinks') {
      w.appendChild(buildNavEditor());
    } else {
      const inp=s.type==='textarea'?document.createElement('textarea'):document.createElement('input');
      if(s.type!=='textarea') inp.type=s.inputType||'text';
      inp.value=CMS.get(content,s.key)??'';
      if(s.placeholder) inp.placeholder=s.placeholder;
      inp.oninput=()=>{ CMS.set(content,s.key,inp.value); pushPreview(); autosave(); };
      w.appendChild(inp);
    }
    return w;
  }
  function buildSettings(){ const body=$('#setBody'); body.innerHTML='';
    settingGroups().forEach(group=>{
      const card=document.createElement('section'); card.className='settings-group';
      const head=document.createElement('div'); head.className='settings-group-head';
      head.innerHTML=`<h4>${group.title||'Pengaturan'}</h4>${group.description?`<p>${group.description}</p>`:''}`;
      card.appendChild(head);
      const fields=document.createElement('div'); fields.className='settings-fields';
      (group.fields||[]).forEach(s=>fields.appendChild(buildField(s)));
      card.appendChild(fields); body.appendChild(card);
    });
  }
  function openSettings(){ buildSettings(); closeDrawers(); $('#setDrawer').classList.add('open'); $('#backdrop').classList.add('show'); }

  /* ---------- login gate ---------- */
  function setAuthState(ok){
    document.body.classList.toggle('auth-ready', !!ok);
    document.body.classList.toggle('auth-locked', !ok);
    const shell=$('#adminShell'), login=$('#loginScreen');
    if(shell) shell.setAttribute('aria-hidden', ok?'false':'true');
    if(login) login.setAttribute('aria-hidden', ok?'true':'false');
    if(ok) setTimeout(pushPreview,120);
    else setTimeout(()=>{ clearLoginFields(); const u=$('#loginUser'); if(u) u.focus(); },80);
  }
  function clearLoginFields(){
    const u=$('#loginUser'), p=$('#loginPass');
    if(u){ u.value=''; u.setAttribute('autocomplete','off'); }
    if(p){ p.value=''; p.setAttribute('autocomplete','new-password'); }
  }
  function wireAuth(){
    const form=$('#loginForm'), user=$('#loginUser'), pass=$('#loginPass'), err=$('#loginError'), card=document.querySelector('.login-card'), toggle=$('#togglePass');
    let loginTouched=false;
    const markTouched=()=>{ loginTouched=true; };
    const authed=(()=>{ try{return sessionStorage.getItem(AUTH_KEY)==='1';}catch(e){return false;} })();
    setAuthState(authed);
    if(!authed){
      clearLoginFields();
      setTimeout(()=>{ if(!loginTouched) clearLoginFields(); },250);
      setTimeout(()=>{ if(!loginTouched) clearLoginFields(); },900);
    }
    [user,pass].forEach(el=>{
      if(!el) return;
      el.addEventListener('focus',markTouched);
      el.addEventListener('input',markTouched);
    });
    if(toggle&&pass){
      toggle.innerHTML=uiSvg('eye');
      toggle.onclick=()=>{
        const open=pass.type==='password';
        pass.type=open?'text':'password';
        toggle.innerHTML=uiSvg(open?'eyeoff':'eye');
        toggle.setAttribute('aria-label', open?'Sembunyikan password':'Lihat password');
        pass.focus();
      };
    }
    if(form&&user&&pass){
      form.onsubmit=e=>{
        e.preventDefault();
        const ok=user.value.trim()==='admin' && pass.value==='admin123';
        if(ok){
          try{sessionStorage.setItem(AUTH_KEY,'1');}catch(ex){}
          if(err) err.textContent='';
          setAuthState(true);
          location.hash='editor';
          toast('Login berhasil');
        } else {
          if(err) err.textContent='Username atau password salah.';
          if(card){ card.classList.remove('bad-login'); void card.offsetWidth; card.classList.add('bad-login'); }
          pass.select();
        }
      };
    }
    const logout=$('#btnLogout');
    if(logout) logout.onclick=()=>{
      try{sessionStorage.removeItem(AUTH_KEY);}catch(e){}
      if(pass) pass.value='';
      closeDrawers();
      setAuthState(false);
    };
  }

  /* ---------- toolbar ---------- */
  function wire(){
    $('#btnTheme').onclick=openTheme; $('#themeClose').onclick=closeDrawers;
    $('#btnSettings').onclick=openSettings; $('#setClose').onclick=closeDrawers;
    $('#backdrop').onclick=closeDrawers;
    $('#btnAddSec').onclick=openAdd; $('#addClose').onclick=()=>$('#addModal').classList.remove('open');
    $('#imgClose').onclick=closeImg; $('#imgModal').onclick=e=>{ if(e.target===$('#imgModal'))closeImg(); };
    $('#iconClose').onclick=()=>$('#iconModal').classList.remove('open'); $('#iconModal').onclick=e=>{ if(e.target===$('#iconModal'))$('#iconModal').classList.remove('open'); };
    $('#addModal').onclick=e=>{ if(e.target===$('#addModal'))$('#addModal').classList.remove('open'); };
    $('#btnExport').onclick=()=>{ saveNow(); CMS.exportJSON(content); toast('content.json diunduh — upload untuk publish'); };
    $('#btnPublish').onclick=publish;
    $('#btnImport').onclick=()=>$('#importFile').click();
    $('#importFile').onchange=async e=>{ if(e.target.files[0]){ try{ content=await CMS.importJSON(e.target.files[0]); pushPreview(); saveNow(); toast('Konten di-import'); }catch(err){ toast('File tidak valid'); } } };
    $('#btnReset').onclick=()=>{ if(confirm('Kembalikan ke konten default? Perubahan yang belum di-export hilang.')){ content=CMS.reset(); pushPreview(); hideStatus(); toast('Direset ke default'); } };
    $('#btnSite').onclick=()=>window.open('../index.html','_blank');
    document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{ device=b.dataset.dev; document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('active',x===b)); $('#stage').classList.toggle('tablet',device==='tablet'); $('#stage').classList.toggle('phone',device==='phone'); });
    window.addEventListener('keydown',e=>{ if((e.metaKey||e.ctrlKey)&&e.key==='s'){ e.preventDefault(); saveNow(); toast('Disimpan di browser'); } });
  }
  function wireStageMotion(){
    const stage=$('#stage');
    if(!stage||stage._stageMotion) return;
    stage._stageMotion=1;
    let raf=0, idle=0, next=null;
    const hide=()=>stage.classList.remove('stage-lit');
    const update=e=>{
      const r=stage.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){ hide(); return; }
      next={x:e.clientX-r.left,y:e.clientY-r.top};
      if(raf) return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        stage.style.setProperty('--stage-x',next.x+'px');
        stage.style.setProperty('--stage-y',next.y+'px');
        stage.classList.add('stage-lit');
        clearTimeout(idle);
        idle=setTimeout(hide,520);
      });
    };
    window.addEventListener('pointermove',update,{passive:true});
    window.addEventListener('mousemove',update,{passive:true});
    stage.addEventListener('pointerleave',()=>{ clearTimeout(idle); idle=setTimeout(hide,160); });
  }
  function wireLoginMotion(){
    const screen=$('#loginScreen');
    if(!screen||screen._loginMotion) return;
    screen._loginMotion=1;
    let raf=0, idle=0, next=null;
    const hide=()=>screen.classList.remove('login-lit');
    const update=e=>{
      const r=screen.getBoundingClientRect();
      next={x:e.clientX-r.left,y:e.clientY-r.top};
      if(raf) return;
      raf=requestAnimationFrame(()=>{
        raf=0;
        screen.style.setProperty('--auth-x',next.x+'px');
        screen.style.setProperty('--auth-y',next.y+'px');
        screen.classList.add('login-lit');
        clearTimeout(idle);
        idle=setTimeout(hide,520);
      });
    };
    window.addEventListener('pointermove',update,{passive:true});
    window.addEventListener('mousemove',update,{passive:true});
    screen.addEventListener('pointerleave',()=>{ clearTimeout(idle); idle=setTimeout(hide,160); });
  }

  /* ---------- publish: write site/content.js live (needs serve.mjs) or fall back to download ---------- */
  async function publish(){
    const button = $('#btnPublish');
    hideStatus();
    if(button){ button.disabled=true; button.dataset.label=button.innerHTML; button.innerHTML=uiSvg('publish')+'<span>Publishing...</span>'; }
    saveNow();
    const body = 'window.DEFAULT_CONTENT = '+JSON.stringify(content,null,2)+';\n';
    try{
      const res = await fetch('/__publish', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(content)});
      if(!res.ok) throw new Error('http '+res.status);
      showPublished();
      toast('Terpublish. Perubahan sudah ditulis ke site/content.js.');
    }catch(e){
      // static host (no publish endpoint) -> download content.js to drop into /site
      const blob=new Blob(['/* AUTO-GENERATED — replace site/content.js then re-upload */\n'+body],{type:'application/javascript'});
      const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='content.js';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast('content.js diunduh — taruh di folder /site lalu upload (server publish tidak aktif)');
    } finally {
      if(button){ button.disabled=false; button.innerHTML=button.dataset.label || (uiSvg('publish')+'<span>Publish</span>'); delete button.dataset.label; }
    }
  }

  /* ---------- paint toolbar/drawers with SVG icons (no emoji) ---------- */
  function paintIcons(){
    const set=(id,ic,label)=>{ const b=$('#'+id); if(b) b.innerHTML=uiSvg(ic)+'<span>'+label+'</span>'; };
    set('btnAddSec','add','Section'); set('btnSettings','settings','Pengaturan'); set('btnTheme','theme','Tema');
    set('btnImport','importr','Import'); set('btnReset','reset','Reset'); set('btnExport','export','Export');
    set('btnSite','site','Situs'); set('btnLogout','logout','Keluar'); set('btnPublish','publish','Publish');
    const dev=document.querySelectorAll('.seg button');
    if(dev[0]) dev[0].innerHTML=uiSvg('desktop')+'<span>Desktop</span>';
    if(dev[1]) dev[1].innerHTML=uiSvg('tablet')+'<span>Tablet</span>';
    if(dev[2]) dev[2].innerHTML=uiSvg('phone')+'<span>HP</span>';
    document.querySelectorAll('.dh h3').forEach(h=>{ const t=h.textContent.replace(/[^\w\sÀ-ÿ]/g,'').trim(); h.innerHTML=uiSvg(/Tema/i.test(t)?'theme':'settings',18)+' '+t; });
    document.querySelectorAll('.tbtn.ghost').forEach(b=>{ if(/Tutup|✕/.test(b.textContent)) b.innerHTML=uiSvg('close')+'<span>Tutup</span>'; });
  }

  function boot(){ wireAuth(); wire(); paintIcons(); wireStageMotion(); wireLoginMotion(); const f=frame(); f.addEventListener('load',()=>setTimeout(pushPreview,80)); [120,400,800,1500].forEach(t=>setTimeout(pushPreview,t)); }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
