/* ============================================================
   SECTION REGISTRY — the modular core.
   Each section type defines:
     • label  : human name (admin)
     • icon   : emoji shown in admin section list
     • render(data, site, P) -> HTML string  (P = base content path, used
       to attach inline-edit bindings; omitted/ignored on the public site)
     • fields : declarative schema (kept for reference / future forms)
   Add a new section type = add one entry here. Nothing else to touch.

   INLINE EDIT BINDINGS (only emitted when edit mode is ON):
     A(path)    text field  -> data-e
     IMG(path)  image        -> data-img   (put on the <img>)
     ICO(path)  icon         -> data-icon  (put on the icon wrapper)
     LIST(path) array        -> data-list  (put on the items container)
     ITEM(path) array item   -> data-item  (put on each item element)
     RATE(path) star rating  -> data-rate
     CATS(path) gallery cat   -> data-catsel
   ============================================================ */
(function(){
  const esc = CMS.esc;
  const svg = (name, cls) => `<svg class="${cls||''}" viewBox="0 0 24 24">${(window.ICONS||{})[name]||''}</svg>`;
  const waSvg = `<svg viewBox="0 0 24 24" fill="currentColor">${window.WA_GLYPH}</svg>`;
  // inline-edit binding helpers come from the portable core
  const {e:A, img:IMG, icon:ICO, list:LIST, item:ITEM, rate:RATE, cat:CATS} = CMS.bindings;
  const eA = (edit,p)=> edit?` data-e="${p}"`:'';   // header/footer pass edit flag explicitly
  const LOGO = `<svg class="brand-mark" viewBox="0 0 48 48" role="img" aria-label="logo"><defs><linearGradient id="pjN" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17436f"/><stop offset="1" stop-color="#0a2540"/></linearGradient></defs><rect width="48" height="48" rx="12" fill="url(#pjN)"/><path d="M14.5 40 L21.4 12 L26.6 12 L33.5 40 Z" fill="#3e4b58"/><path d="M14.5 40 L21.4 12" stroke="#cdd6df" stroke-width="1.2" opacity=".4"/><path d="M33.5 40 L26.6 12" stroke="#cdd6df" stroke-width="1.2" opacity=".4"/><path d="M24 39 L24 13" stroke="#F6A623" stroke-width="2.6" stroke-dasharray="4 3.4" stroke-linecap="round"/></svg>`;
  // logo: custom uploaded image if set, else the default mark — editable (click to replace) in edit mode
  const brandMark = (c,edit) => c.site.logo
    ? `<img class="brand-mark" src="${esc(c.site.logo)}" alt="logo"${edit?' data-img="site.logo"':''}>`
    : (edit ? LOGO.replace('<svg ', '<svg data-img="site.logo" ') : LOGO);

  const F = {
    text:(key,label)=>({key,label,type:'text'}),
    area:(key,label)=>({key,label,type:'textarea'}),
    img:(key,label)=>({key,label,type:'image'}),
    icon:(key,label)=>({key,label,type:'icon'}),
    num:(key,label)=>({key,label,type:'number'}),
  };

  window.SECTIONS = {

    /* ---------------- HEADER (chrome — fixed top, not in body list) ---------------- */
    header:{
      chrome:true, label:'Header', icon:'🔝',
      render(c,o){ const edit=o&&o.edit;
        const links=(c.nav&&c.nav.links||[]).map((l,i)=>`<a href="${esc(l.target)}"><span${eA(edit,'nav.links.'+i+'.label')}>${esc(l.label)}</span></a>`).join('');
        return `<header id="top"><div class="wrap nav">
      <a href="#top" class="brand">${brandMark(c,edit)}<div class="brand-text"><strong${eA(edit,'site.brandName')}>${esc(c.site.brandName)}</strong><small${eA(edit,'site.brandTagline')}>${esc(c.site.brandTagline)}</small></div></a>
      <nav class="nav-links" id="navLinks">${links}</nav>
      <div class="nav-cta"><a href="#" class="btn btn-wa wa-link">${waSvg}<span${eA(edit,'site.waButtonLabel')}>${esc(c.site.waButtonLabel||'WhatsApp')}</span></a></div>
      <button class="hamburger" id="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
    </div></header>`;
      }
    },

    /* ---------------- FOOTER (chrome — fixed bottom) ---------------- */
    footer:{
      chrome:true, label:'Footer', icon:'🔚',
      render(c,o){ const edit=o&&o.edit; const f=c.footer||{};
        const svcLinks=(f.colServices&&f.colServices.links||[]).map((t,i)=>`<a href="#sec-services"><span${eA(edit,'footer.colServices.links.'+i)}>${esc(t)}</span></a>`).join('');
        const navLinks=(f.colNav&&f.colNav.links||[]).map((l,i)=>`<a href="${esc(l.target)}"><span${eA(edit,'footer.colNav.links.'+i+'.label')}>${esc(l.label)}</span></a>`).join('');
        const areas=(f.areas||[]).map((a,i)=>`<span${eA(edit,'footer.areas.'+i)}>${esc(a)}</span>`).join('');
        return `<footer><div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand"><div class="brand">${brandMark(c,edit)}<div class="brand-text"><strong${eA(edit,'site.brandName')}>${esc(c.site.brandName)}</strong><small${eA(edit,'site.brandTagline')}>${esc(c.site.brandTagline)}</small></div></div><p${eA(edit,'footer.about')}>${esc(f.about)}</p></div>
        <div class="foot-col"><h5${eA(edit,'footer.colServices.title')}>${esc(f.colServices&&f.colServices.title)}</h5>${svcLinks}</div>
        <div class="foot-col"><h5${eA(edit,'footer.colNav.title')}>${esc(f.colNav&&f.colNav.title)}</h5>${navLinks}</div>
        <div class="foot-col"><h5${eA(edit,'footer.areaTitle')}>${esc(f.areaTitle)}</h5><div class="area-tags">${areas}</div>
          <a href="#" class="btn btn-wa wa-link" style="margin-top:20px">${waSvg}<span${eA(edit,'site.phone')}>${esc(c.site.phone)}</span></a></div>
      </div>
      <div class="foot-bottom"><span${eA(edit,'footer.copyright')}>${esc(f.copyright)}</span><span${eA(edit,'footer.tagline')}>${esc(f.tagline)}</span></div>
    </div></footer>`;
      }
    },

    /* ---------------- HERO ---------------- */
    hero:{
      label:'Hero', icon:'🏁',
      fields:[
        F.text('eyebrow','Eyebrow'),F.text('titleBefore','Judul depan'),F.text('titleHighlight','Judul highlight'),
        F.text('titleAfter','Judul belakang'),F.area('lead','Deskripsi'),F.text('primaryLabel','Tombol utama'),
        F.text('secondaryLabel','Tombol kedua'),F.text('secondaryTarget','Target tombol kedua'),
        {key:'trust',label:'Poin kepercayaan',type:'list',item:{type:'text'}},F.img('image','Foto utama'),
        F.text('floatCard1Title','Kartu 1 judul'),F.text('floatCard1Sub','Kartu 1 sub'),
        F.text('floatCard2Title','Kartu 2 judul'),F.text('floatCard2Sub','Kartu 2 sub'),
      ],
      render(d,site,P){
        return `<section class="hero" id="sec-hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow reveal left"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span>
      <h1 class="reveal left d1"><span${A(P+'.titleBefore')}>${esc(d.titleBefore)}</span><span class="hl"${A(P+'.titleHighlight')}>${esc(d.titleHighlight)}</span><span${A(P+'.titleAfter')}>${esc(d.titleAfter)}</span></h1>
      <p class="lead reveal left d2"${A(P+'.lead')}>${esc(d.lead)}</p>
      <div class="hero-cta reveal left d3">
        <a href="#" class="btn btn-wa btn-lg wa-link">${waSvg}<span${A(P+'.primaryLabel')}>${esc(d.primaryLabel)}</span></a>
        <a href="${esc(d.secondaryTarget)}" class="btn btn-outline btn-lg"><span${A(P+'.secondaryLabel')}>${esc(d.secondaryLabel)}</span></a>
      </div>
      <div class="hero-trust reveal left d4"${LIST(P+'.trust')}>
        ${(d.trust||[]).map((t,i)=>`<div class="ti"${ITEM(P+'.trust.'+i)}>${svg('check')}<span${A(P+'.trust.'+i)}>${esc(t)}</span></div>`).join('')}
      </div>
    </div>
    <div class="hero-media reveal right d2">
      <div class="hero-photo tilt"><img class="ph-img" src="${esc(d.image)}" alt="${esc(d.eyebrow)}"${IMG(P+'.image')}></div>
      <div class="float-card fc-1">
        <div class="ic" style="background:var(--blue-50);color:var(--blue)"${ICO(P+'.floatCard1Icon')}>${svg(d.floatCard1Icon||'layers')}</div>
        <div><strong${A(P+'.floatCard1Title')}>${esc(d.floatCard1Title)}</strong><small${A(P+'.floatCard1Sub')}>${esc(d.floatCard1Sub)}</small></div>
      </div>
      <div class="float-card fc-2">
        <div class="ic" style="background:#FEF3DD;color:var(--amber)"${ICO(P+'.floatCard2Icon')}>${svg(d.floatCard2Icon||'checkbox')}</div>
        <div><strong${A(P+'.floatCard2Title')}>${esc(d.floatCard2Title)}</strong><small${A(P+'.floatCard2Sub')}>${esc(d.floatCard2Sub)}</small></div>
      </div>
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- STATS ---------------- */
    stats:{
      label:'Statistik', icon:'📊',
      fields:[{key:'items',label:'Angka',type:'list',item:{fields:[F.text('value','Angka'),F.text('label','Keterangan')]}}],
      render(d,site,P){
        return `<section class="statband">
  <div class="wrap stat-grid"${LIST(P+'.items')}>
    ${(d.items||[]).map((s,i)=>`<div class="stat reveal d${i}"${ITEM(P+'.items.'+i)}><div class="num"${A(P+'.items.'+i+'.value')}>${esc(s.value)}</div><div class="lbl"${A(P+'.items.'+i+'.label')}>${esc(s.label)}</div></div>`).join('')}
  </div>
</section>`;
      }
    },

    /* ---------------- SERVICES ---------------- */
    services:{
      label:'Layanan', icon:'🛠️',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.area('subtitle','Subjudul'),
        {key:'items',label:'Layanan',type:'list',item:{fields:[F.icon('icon','Ikon'),F.text('title','Judul'),F.area('desc','Deskripsi')]}}],
      render(d,site,P){
        return `<section class="section services" id="sec-services">
  <div class="wrap">
    <div class="section-head center reveal"><span class="eyebrow"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span><h2${A(P+'.title')}>${esc(d.title)}</h2><p${A(P+'.subtitle')}>${esc(d.subtitle)}</p></div>
    <div class="svc-grid"${LIST(P+'.items')}>
      ${(d.items||[]).map((s,i)=>`<div class="svc-card reveal d${i%3}"${ITEM(P+'.items.'+i)}>
        <div class="svc-ic"${ICO(P+'.items.'+i+'.icon')}>${svg(s.icon)}</div>
        <h3${A(P+'.items.'+i+'.title')}>${esc(s.title)}</h3><p${A(P+'.items.'+i+'.desc')}>${esc(s.desc)}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- WHY US ---------------- */
    why:{
      label:'Keunggulan', icon:'⭐',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.img('image','Foto'),
        {key:'features',label:'Keunggulan',type:'list',item:{fields:[F.icon('icon','Ikon'),F.text('title','Judul'),F.area('desc','Deskripsi')]}}],
      render(d,site,P){
        return `<section class="section" id="sec-why">
  <div class="wrap why-grid">
    <div class="reveal left"><div class="why-visual tilt"><img class="ph-img" src="${esc(d.image)}" alt="${esc(d.title)}"${IMG(P+'.image')}></div></div>
    <div>
      <span class="eyebrow reveal"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span>
      <h2 class="reveal d1" style="font-size:clamp(28px,3.6vw,42px);margin:14px 0 24px"${A(P+'.title')}>${esc(d.title)}</h2>
      <div${LIST(P+'.features')}>${(d.features||[]).map((f,i)=>`<div class="feat reveal d${i+1}"${ITEM(P+'.features.'+i)}>
        <div class="fic"${ICO(P+'.features.'+i+'.icon')}>${svg(f.icon)}</div>
        <div><h4${A(P+'.features.'+i+'.title')}>${esc(f.title)}</h4><p${A(P+'.features.'+i+'.desc')}>${esc(f.desc)}</p></div>
      </div>`).join('')}</div>
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- PROCESS ---------------- */
    process:{
      label:'Proses', icon:'🔢',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.area('subtitle','Subjudul'),
        {key:'steps',label:'Langkah',type:'list',item:{fields:[F.text('title','Judul'),F.area('desc','Deskripsi')]}}],
      render(d,site,P){
        return `<section class="section process">
  <div class="wrap">
    <div class="section-head center reveal"><span class="eyebrow"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span><h2${A(P+'.title')}>${esc(d.title)}</h2><p${A(P+'.subtitle')}>${esc(d.subtitle)}</p></div>
    <div class="proc-grid"${LIST(P+'.steps')}>
      ${(d.steps||[]).map((s,i)=>`<div class="proc-step reveal d${i}"${ITEM(P+'.steps.'+i)}><div class="proc-num">${String(i+1).padStart(2,'0')}</div><h4${A(P+'.steps.'+i+'.title')}>${esc(s.title)}</h4><p${A(P+'.steps.'+i+'.desc')}>${esc(s.desc)}</p></div>`).join('')}
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- SEGMENTS ---------------- */
    segments:{
      label:'Segmen', icon:'🏘️',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.area('subtitle','Subjudul'),
        {key:'items',label:'Segmen',type:'list',item:{fields:[F.text('title','Judul'),F.area('desc','Deskripsi'),F.img('image','Foto')]}}],
      render(d,site,P){
        return `<section class="section" id="sec-segments">
  <div class="wrap">
    <div class="section-head center reveal"><span class="eyebrow"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span><h2${A(P+'.title')}>${esc(d.title)}</h2><p${A(P+'.subtitle')}>${esc(d.subtitle)}</p></div>
    <div class="seg-grid"${LIST(P+'.items')}>
      ${(d.items||[]).map((s,i)=>`<div class="seg-card reveal zoom d${i}"${ITEM(P+'.items.'+i)}>
        <img class="ph-img" src="${esc(s.image)}" alt="${esc(s.title)}"${IMG(P+'.items.'+i+'.image')}>
        <div class="seg-overlay"><h3${A(P+'.items.'+i+'.title')}>${esc(s.title)}</h3><p${A(P+'.items.'+i+'.desc')}>${esc(s.desc)}</p></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- GALLERY ---------------- */
    gallery:{
      label:'Galeri', icon:'🖼️',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.area('subtitle','Subjudul'),
        {key:'filters',label:'Filter',type:'list',item:{fields:[F.text('key','Key'),F.text('label','Label')]}},
        {key:'items',label:'Foto',type:'list',item:{fields:[F.img('image','Foto'),F.text('cat','Kategori'),F.text('caption','Keterangan')]}}],
      render(d,site,P){
        return `<section class="section gallery" id="sec-gallery">
  <div class="wrap">
    <div class="section-head center reveal"><span class="eyebrow"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span><h2${A(P+'.title')}>${esc(d.title)}</h2><p${A(P+'.subtitle')}>${esc(d.subtitle)}</p></div>
    <div class="gal-filter reveal">
      ${(d.filters||[]).map((f,i)=>`<button class="${i===0?'active':''}" data-filter="${esc(f.key)}"><span${A(P+'.filters.'+i+'.label')}>${esc(f.label)}</span></button>`).join('')}
    </div>
    <div class="gal-grid"${LIST(P+'.items')}>
      ${(d.items||[]).map((g,i)=>`<div class="gal-item reveal zoom d${i%3}" data-cat="${esc(g.cat)}"${ITEM(P+'.items.'+i)}${CATS(P+'.items.'+i+'.cat')}><img class="ph-img" src="${esc(g.image)}" alt="${esc(g.caption)}"${IMG(P+'.items.'+i+'.image')}></div>`).join('')}
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- TESTIMONIALS ---------------- */
    testimonials:{
      label:'Testimoni', icon:'💬',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.area('subtitle','Subjudul'),
        {key:'items',label:'Testimoni',type:'list',item:{fields:[F.area('quote','Kutipan'),F.text('name','Nama'),F.text('role','Jabatan'),F.num('rating','Bintang')]}}],
      render(d,site,P){
        const star = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"/></svg>`;
        const mono = n => esc((n||'?').replace(/^(Bpk\.|Ibu|Bp\.|Pak|Bu)\s*/i,'').trim().charAt(0).toUpperCase());
        return `<section class="section" id="sec-testimonials">
  <div class="wrap">
    <div class="section-head center reveal"><span class="eyebrow"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span><h2${A(P+'.title')}>${esc(d.title)}</h2><p${A(P+'.subtitle')}>${esc(d.subtitle)}</p></div>
    <div class="test-grid"${LIST(P+'.items')}>
      ${(d.items||[]).map((t,i)=>`<div class="test-card reveal d${i}"${ITEM(P+'.items.'+i)}>
        <div class="stars"${RATE(P+'.items.'+i+'.rating')}>${star.repeat(Math.max(0,Math.min(5,+t.rating||5)))}</div>
        <p class="quote">"<span${A(P+'.items.'+i+'.quote')}>${esc(t.quote)}</span>"</p>
        <div class="test-meta"><div class="avatar">${mono(t.name)}</div><div><strong${A(P+'.items.'+i+'.name')}>${esc(t.name)}</strong><small${A(P+'.items.'+i+'.role')}>${esc(t.role)}</small></div></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
      }
    },

    /* ---------------- CTA ---------------- */
    cta:{
      label:'Ajakan (CTA)', icon:'📣',
      fields:[F.text('eyebrow','Eyebrow'),F.text('title','Judul'),F.area('subtitle','Subjudul'),
        F.text('primaryLabel','Tombol WhatsApp'),{key:'chips',label:'Chip',type:'list',item:{type:'text'}}],
      render(d,site,P){
        const phone = (site&&site.phone)||'';
        const tel = phone.replace(/[^0-9+]/g,'');
        return `<section class="section cta-final" id="sec-cta">
  <div class="wrap">
    <div class="cta-card reveal zoom">
      <span class="eyebrow"${A(P+'.eyebrow')}>${esc(d.eyebrow)}</span>
      <h2${A(P+'.title')}>${esc(d.title)}</h2>
      <p${A(P+'.subtitle')}>${esc(d.subtitle)}</p>
      <div class="cta-actions">
        <a href="#" class="btn btn-wa btn-lg wa-link">${waSvg}<span${A(P+'.primaryLabel')}>${esc(d.primaryLabel)}</span></a>
        <a href="tel:+${esc(tel)}" class="btn btn-outline btn-lg btn-call">${svg('phone')}<span${A('site.phone')}>${esc(phone)}</span></a>
      </div>
      <div class="cta-chips"${LIST(P+'.chips')}>
        ${(d.chips||[]).map((c,i)=>`<div class="chip"${ITEM(P+'.chips.'+i)}>${svg(i===0?'location':(i===1?'clock':'check'))}<span${A(P+'.chips.'+i)}>${esc(c)}</span></div>`).join('')}
      </div>
    </div>
  </div>
</section>`;
      }
    },

  };
})();
