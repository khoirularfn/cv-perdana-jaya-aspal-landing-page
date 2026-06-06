/* ============================================================
   INLINE EDIT OVERLAY (portable)  ·  CMS.initEdit
   Runs INSIDE the preview iframe. Turns the rendered page into a
   click-to-edit canvas and posts every change to the admin parent:
     • click text  -> contenteditable                (op:text)
     • hover image  -> "Ganti Gambar" button          (op:image)
     • click icon   -> icon picker                    (op:icon)
     • click stars  -> set rating                     (op:text, rerender)
     • hover item   -> ↑ ↓ ✕ ; list shows "+ Tambah"  (op:item)
     • hover section-> move / hide / delete           (op:section)
   No project knowledge — purely driven by data-* binding attributes.
   ============================================================ */
(function(){
  const send = msg => { try{ parent.postMessage(Object.assign({type:'cms-edit'},msg),'*'); }catch(e){} };

  function injectCSS(){
    if(document.getElementById('cms-edit-css')) return;
    const css = `
    body.cms-editing .wa-float, body.cms-editing .scroll-prog{display:none!important}
    body.cms-editing a{cursor:default}
    [data-e]{cursor:text;transition:box-shadow .12s, background .12s;border-radius:4px}
    body.cms-editing [data-e]:hover{box-shadow:0 0 0 2px rgba(43,139,255,.45)}
    body.cms-editing [data-e]:focus{outline:none;box-shadow:0 0 0 2px #2b8bff;background:rgba(43,139,255,.08)}
    body.cms-editing [data-secidx]{position:relative}
    body.cms-editing [data-secidx]:hover{outline:2px dashed rgba(43,139,255,.35);outline-offset:-2px}
    body.cms-editing [data-item]{position:relative}
    body.cms-editing [data-img]{cursor:pointer}
    .cms-tools{position:absolute;z-index:50;display:flex;gap:4px;background:#0f1c2e;border:1px solid #294a6e;border-radius:9px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .15s}
    .cms-sectools{top:10px;right:10px}
    .cms-itemtools{top:6px;right:6px;transform:scale(.92)}
    [data-secidx]:hover>.cms-sectools, [data-item]:hover>.cms-itemtools{opacity:1;pointer-events:auto}
    .cms-tools button{width:28px;height:28px;border:none;border-radius:7px;background:#1b2f49;color:#cfe0f5;display:grid;place-items:center;cursor:pointer;font-size:14px;line-height:1}
    .cms-tools button:hover{background:#2b8bff;color:#fff}
    .cms-tools button.danger:hover{background:#ff5c6c}
    .cms-tools svg{width:15px;height:15px}
    .cms-sectag{position:absolute;top:10px;left:10px;z-index:50;background:#0f1c2e;border:1px solid #294a6e;color:#9fc2ee;font:600 11px/1 system-ui;padding:5px 9px;border-radius:7px;letter-spacing:.04em;text-transform:uppercase;opacity:0;transition:opacity .15s}
    [data-secidx]:hover>.cms-sectag{opacity:1}
    [data-hidden]{position:relative}
    [data-hidden]::after{content:"Tersembunyi di situs publik";position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(10,20,34,.55) 0 14px,rgba(10,20,34,.42) 14px 28px);display:flex;align-items:center;justify-content:center;color:#fff;font:700 14px system-ui;z-index:40;pointer-events:none}
    .cms-imgbtn{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:45;background:#0f1c2e;border:1px solid #2b8bff;color:#fff;font:600 13px system-ui;padding:9px 14px;border-radius:10px;cursor:pointer;display:flex;gap:7px;align-items:center;opacity:0;transition:opacity .15s;box-shadow:0 8px 24px rgba(0,0,0,.4)}
    .cms-imgwrap:hover .cms-imgbtn{opacity:1}
    .cms-add{display:flex;align-items:center;justify-content:center;gap:8px;min-height:90px;border:2px dashed #9bb6d6;border-radius:14px;color:#5772a0;background:rgba(43,139,255,.05);font:700 14px system-ui;cursor:pointer;width:100%}
    .cms-add:hover{border-color:#2b8bff;color:#2b8bff;background:rgba(43,139,255,.12)}
    .cms-catsel{position:absolute;left:8px;bottom:8px;z-index:46;font:600 12px system-ui;border:1px solid #2b8bff;border-radius:8px;padding:5px 8px;background:#0f1c2e;color:#fff}
    [data-rate],[data-rate] svg{cursor:pointer}
    `;
    const st=document.createElement('style'); st.id='cms-edit-css'; st.textContent=css; document.head.appendChild(st);
  }

  const ic = {
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 15l-6-6-6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 9l6 6 6-6"/></svg>',
    del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeoff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.9 17.9A10 10 0 0112 20C5 20 1 12 1 12a18 18 0 015-5.9M9.9 4.2A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.2 3.2M1 1l22 22"/></svg>'
  };
  const btn=(html,title,cls)=>{ const b=document.createElement('button'); b.innerHTML=html; b.title=title; if(cls)b.className=cls; return b; };

  let tTimer=null;
  function bindText(){ document.querySelectorAll('[data-e]').forEach(el=>{ if(el._t)return; el._t=1;
    el.setAttribute('contenteditable','true'); el.spellcheck=false;
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
    el.addEventListener('input',()=>{ clearTimeout(tTimer); const path=el.getAttribute('data-e'), value=el.textContent; tTimer=setTimeout(()=>send({op:'text',path,value}),180); });
    el.addEventListener('paste',e=>{ e.preventDefault(); const t=(e.clipboardData||window.clipboardData).getData('text'); document.execCommand('insertText',false,t); }); }); }

  function bindImages(){ document.querySelectorAll('[data-img]').forEach(img=>{ if(img._i)return; img._i=1;
    const path=img.getAttribute('data-img'); const host=img.parentElement;
    if(getComputedStyle(host).position==='static') host.style.position='relative'; host.classList.add('cms-imgwrap');
    const b=document.createElement('div'); b.className='cms-imgbtn'; b.innerHTML='🖼️ Ganti Gambar';
    b.addEventListener('click',e=>{ e.stopPropagation(); send({op:'image',path}); }); host.appendChild(b);
    img.addEventListener('click',e=>{ e.stopPropagation(); send({op:'image',path}); }); }); }

  function bindIcons(){ document.querySelectorAll('[data-icon]').forEach(el=>{ if(el._ic)return; el._ic=1; el.style.cursor='pointer'; el.title='Klik untuk ganti ikon';
    el.addEventListener('click',e=>{ e.stopPropagation(); send({op:'icon',path:el.getAttribute('data-icon')}); }); }); }

  function bindRatings(){ document.querySelectorAll('[data-rate]').forEach(w=>{ if(w._r)return; w._r=1; const path=w.getAttribute('data-rate');
    w.querySelectorAll('svg').forEach((s,i)=>s.addEventListener('click',e=>{ e.stopPropagation(); send({op:'text',path,value:i+1,rerender:true}); })); }); }

  function bindCats(){ document.querySelectorAll('[data-catsel]').forEach(item=>{ if(item._c)return; item._c=1;
    const path=item.getAttribute('data-catsel'), sec=item.closest('[data-secidx]'); if(!sec)return;
    const opts=[...sec.querySelectorAll('.gal-filter button')].map(b=>({key:b.getAttribute('data-filter'),label:(b.textContent||'').trim()})).filter(o=>o.key&&o.key!=='all');
    const sel=document.createElement('select'); sel.className='cms-catsel';
    opts.forEach(o=>{ const op=document.createElement('option'); op.value=o.key; op.textContent=o.label; if(item.getAttribute('data-cat')===o.key)op.selected=true; sel.appendChild(op); });
    sel.addEventListener('click',e=>e.stopPropagation());
    sel.addEventListener('change',e=>{ e.stopPropagation(); item.setAttribute('data-cat',sel.value); send({op:'text',path,value:sel.value,rerender:true}); });
    item.appendChild(sel); }); }

  function bindItems(){
    document.querySelectorAll('[data-item]').forEach(item=>{ if(item._it)return; item._it=1; const path=item.getAttribute('data-item');
      const tools=document.createElement('div'); tools.className='cms-tools cms-itemtools';
      const up=btn(ic.up,'Naik'), dn=btn(ic.down,'Turun'), del=btn(ic.del,'Hapus','danger');
      up.onclick=e=>{e.stopPropagation();send({op:'item',action:'up',path});};
      dn.onclick=e=>{e.stopPropagation();send({op:'item',action:'down',path});};
      del.onclick=e=>{e.stopPropagation(); if(confirm('Hapus item ini?')) send({op:'item',action:'del',path});};
      tools.append(up,dn,del); item.appendChild(tools); });
    document.querySelectorAll('[data-list]').forEach(list=>{ if(list._l)return; list._l=1; const path=list.getAttribute('data-list');
      const add=document.createElement('button'); add.className='cms-add'; add.innerHTML='＋ Tambah';
      add.onclick=e=>{e.stopPropagation();send({op:'item',action:'add',path});}; list.appendChild(add); }); }

  function bindSections(){ document.querySelectorAll('[data-secidx]').forEach(sec=>{ if(sec._s)return; sec._s=1;
    const idx=+sec.getAttribute('data-secidx'), type=sec.getAttribute('data-sectype'), hidden=sec.hasAttribute('data-hidden');
    const tag=document.createElement('div'); tag.className='cms-sectag'; tag.textContent=type;
    const tools=document.createElement('div'); tools.className='cms-tools cms-sectools';
    const up=btn(ic.up,'Pindah ke atas'), dn=btn(ic.down,'Pindah ke bawah'), eye=btn(hidden?ic.eyeoff:ic.eye,hidden?'Tampilkan':'Sembunyikan'), del=btn(ic.del,'Hapus section','danger');
    up.onclick=e=>{e.stopPropagation();send({op:'section',action:'up',idx});};
    dn.onclick=e=>{e.stopPropagation();send({op:'section',action:'down',idx});};
    eye.onclick=e=>{e.stopPropagation();send({op:'section',action:'hide',idx});};
    del.onclick=e=>{e.stopPropagation(); if(confirm('Hapus section "'+type+'"?')) send({op:'section',action:'del',idx});};
    tools.append(up,dn,eye,del); sec.appendChild(tag); sec.appendChild(tools); }); }

  function blockNav(){ if(document._nav)return; document._nav=1;
    document.addEventListener('click',e=>{ if(!document.body.classList.contains('cms-editing'))return; const a=e.target.closest('a'); if(a)e.preventDefault(); },true); }

  CMS.initEdit=function(){ injectCSS(); blockNav(); bindText(); bindImages(); bindIcons(); bindRatings(); bindCats(); bindItems(); bindSections(); };
})();
