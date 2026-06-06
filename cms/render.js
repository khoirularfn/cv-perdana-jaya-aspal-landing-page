/* ============================================================
   RENDER ENGINE (portable)  ·  CMS.render
   Turns a content object into the live page using the section
   registry from CMS.config.sections. Knows NOTHING project-specific:
     • header / footer  -> registry entries flagged {chrome:true}
     • body sections    -> content.sections[] mapped through the registry
     • theme            -> CMS.applyTheme (camelCase tokens -> --kebab vars)
   Also hosts generic chrome (scroll bar, floating WA, lightbox) and the
   live-preview message channel used by the admin panel.
   ============================================================ */
(function(){
  const esc = CMS.esc;
  let globalsWired=false;

  function reg(){ return CMS.config.sections||{}; }
  function sectionId(s,i){
    return String(s.id||('sec-'+(s.type||'section')+'-'+(i+1)))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g,'-')
      .replace(/^-+|-+$/g,'') || ('sec-section-'+(i+1));
  }

  function buildBody(c, edit){
    const R=reg();
    return (c.sections||[]).map((s,i)=>{
      if(!edit && s.enabled===false) return '';
      const def=R[s.type];
      if(!def||def.chrome) return def?'' : `<!-- unknown section: ${esc(s.type)} -->`;
      let html; try{ html=def.render(s.data||{}, c.site, 'sections.'+i+'.data'); }
      catch(e){ console.error('render error', s.type, e); return ''; }
      const attrs='id="'+esc(sectionId(s,i))+'" data-secidx="'+i+'" data-sectype="'+esc(s.type)+'"'+(s.enabled===false?' data-hidden="1"':'');
      return html.replace(/<section\b([^>]*)>/i,(_,rawAttrs)=>{
        const cleaned=String(rawAttrs||'').replace(/\s+id=(["']).*?\1/i,'');
        return '<section '+attrs+cleaned+'>';
      });
    }).join('\n');
  }

  function renderSite(c, opts){
    opts=opts||{}; const R=reg();
    CMS.setEdit(!!opts.edit);
    CMS.applyTheme(c.theme);
    if(c.site){ document.title=c.site.title||document.title;
      const m=document.querySelector('meta[name="description"]'); if(m&&c.site.description) m.setAttribute('content',c.site.description); }
    const head = R.header ? R.header.render(c,{edit:opts.edit}) : '';
    const foot = R.footer ? R.footer.render(c,{edit:opts.edit}) : '';
    const app = document.querySelector(CMS.config.mount||'#app');
    app.innerHTML = head + '<main id="sections">'+buildBody(c,opts.edit)+'</main>' + foot;
    ensureChrome();
    wire(c, opts);
    document.body.classList.toggle('cms-editing', !!opts.edit);
    if(!opts.edit){
      // lite mode = old/low-power phones or reduced-motion: drop continuous decorative loops
      const lite = matchMedia('(prefers-reduced-motion: reduce)').matches
        || (navigator.deviceMemory && navigator.deviceMemory<=4)
        || (navigator.hardwareConcurrency && navigator.hardwareConcurrency<=4);
      document.body.classList.toggle('lite', !!lite);
    }
    if(opts.edit && CMS.initEdit) CMS.initEdit();
  }

  /* persistent overlays */
  function ensureChrome(){
    if(!document.getElementById('scrollProg')){ const sp=document.createElement('div'); sp.className='scroll-prog'; sp.id='scrollProg'; document.body.prepend(sp); }
    if(!document.getElementById('waFloat') && window.WA_GLYPH){ const w=document.createElement('a'); w.id='waFloat'; w.className='wa-float wa-link'; w.setAttribute('aria-label','Chat WhatsApp');
      w.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor">'+window.WA_GLYPH+'</svg><span class="wa-label">Chat Sekarang</span>'; document.body.appendChild(w); }
    if(!document.getElementById('lightbox')){ const lb=document.createElement('div'); lb.className='lightbox'; lb.id='lightbox';
      lb.innerHTML='<button class="lb-close" id="lbClose" aria-label="Tutup">&times;</button><img id="lbImg" src="" alt="">'; document.body.appendChild(lb); }
  }

  function wire(c, opts){
    const num=(c.site&&c.site.waNumber)||'', msg=(c.site&&c.site.waMessage)||'';
    const href='https://wa.me/'+num+'?text='+encodeURIComponent(msg);
    document.querySelectorAll('.wa-link').forEach(a=>{ a.href=href; if(!opts.preview){a.target='_blank';a.rel='noopener';} });
    const hb=document.getElementById('hamburger'), nl=document.getElementById('navLinks');
    if(hb&&nl){ hb.onclick=()=>{hb.classList.toggle('open');nl.classList.toggle('mobile-open');};
      nl.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{hb.classList.remove('open');nl.classList.remove('mobile-open');})); }
    const fb=document.querySelectorAll('.gal-filter button'), gi=document.querySelectorAll('.gal-item');
    fb.forEach(b=>b.onclick=()=>{ if(CMS.edit) return; fb.forEach(x=>x.classList.remove('active')); b.classList.add('active');
      const f=b.dataset.filter; gi.forEach(it=>it.classList.toggle('hide', !(f==='all'||it.dataset.cat===f))); });
    const lb=document.getElementById('lightbox'), lbImg=document.getElementById('lbImg'), lbClose=document.getElementById('lbClose');
    const zoom='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" stroke-linecap="round"/></svg>';
    document.querySelectorAll('.gal-item').forEach(it=>{ const img=it.querySelector('img'); if(!img)return;
      if(!it.querySelector('.gal-zoom')){ const b=document.createElement('span'); b.className='gal-zoom'; b.innerHTML=zoom; it.appendChild(b); }
      it.onclick=()=>{ if(opts.preview)return; lbImg.src=img.src; lb.classList.add('open'); document.body.style.overflow='hidden'; }; });
    if(lb&&!lb._wired){ lb._wired=true; const close=()=>{lb.classList.remove('open');document.body.style.overflow='';};
      lbClose.onclick=close; lb.addEventListener('click',e=>{if(e.target===lb)close();});
      document.addEventListener('keydown',e=>{if(e.key==='Escape')close();}); }
    const rv=Array.from(document.querySelectorAll('.reveal'));
    if(opts.edit){ rv.forEach(el=>el.classList.add('in')); }
    else { const inV=el=>el.getBoundingClientRect().top<(window.innerHeight||800)-30;
      requestAnimationFrame(()=>rv.forEach(el=>{if(inV(el))el.classList.add('in');}));
      if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
        rv.forEach(el=>{if(!el.classList.contains('in'))io.observe(el);}); } else rv.forEach(el=>el.classList.add('in'));
      setTimeout(()=>rv.forEach(el=>{if(inV(el))el.classList.add('in');}),900); }
    if(!opts.edit) document.querySelectorAll('.stat .num').forEach(el=>{
      const run=()=>{ if(el.dataset.done)return; el.dataset.done='1'; const orig=el.innerHTML, raw=el.textContent.trim(), m=raw.match(/(\d+)/); if(!m)return;
        const tgt=+m[1], pre=raw.slice(0,m.index), suf=raw.slice(m.index+m[1].length), t0=performance.now();
        const tick=now=>{ const p=Math.min(1,(now-t0)/1100), v=Math.round((1-Math.pow(1-p,3))*tgt); if(p<1){el.textContent=pre+v+suf;requestAnimationFrame(tick);} else el.innerHTML=orig; };
        requestAnimationFrame(tick); };
      if('IntersectionObserver' in window){ const o=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){run();o.unobserve(x.target);}}),{threshold:.5}); o.observe(el); } else run(); });
    if(!opts.edit && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      document.querySelectorAll('.tilt').forEach(el=>{ let raf=null;
        el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
          if(raf)return; raf=requestAnimationFrame(()=>{ el.style.transform=`perspective(900px) rotateX(${(-y*5).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`; raf=null; }); });
        el.addEventListener('pointerleave',()=>{ el.style.transform=''; }); }); }
    if(!globalsWired){ globalsWired=true;
      window.addEventListener('scroll',()=>{ const h=document.documentElement, max=h.scrollHeight-h.clientHeight;
        const p=document.getElementById('scrollProg'); if(p)p.style.width=(max>0?(h.scrollTop/max*100):0)+'%';
        const hd=document.getElementById('top'); if(hd)hd.classList.toggle('scrolled',window.scrollY>12); },{passive:true}); }
  }

  window.addEventListener('message',e=>{ if(e.data&&e.data.type==='cms-render'&&e.data.content) renderSite(e.data.content,{preview:true,edit:!!e.data.edit}); });
  CMS.render = renderSite;
})();
