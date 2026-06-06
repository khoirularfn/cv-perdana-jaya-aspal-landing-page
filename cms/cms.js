/* ============================================================
   MINI-CMS CORE  ·  window.CMS
   Portable, backend-less, inline-editing CMS engine.
   Project-agnostic: drop the /cms folder into any site, then call
   CMS.configure({...}) from your project config. Nothing in here
   knows about a specific website.

   Plug it in:
     CMS.configure({
       mount:        '#app',                 // where the page renders
       storageKey:   'mysite_v1',            // localStorage namespace
       defaultContent: window.SITE_CONTENT,  // seed content object
       sections:     window.SECTIONS,        // section registry (render+fields)
       images:       window.SITE_IMAGES,     // image library for the picker
     });

   Message protocol (admin <-> preview iframe):
     cms-ready   preview -> admin : iframe loaded, send me content
     cms-render  admin -> preview : {content, edit}
     cms-edit    preview -> admin : {op, ...} inline change
   ============================================================ */
window.CMS = (function(){
  let cfg = { mount:'#app', storageKey:'cms_content_v1', defaultContent:{}, sections:{}, images:[] };
  let EDIT = false;

  /* ---------- utils ---------- */
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const kebab = k => k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());

  /* ---------- path get/set (e.g. "sections.2.data.items.0.title") ---------- */
  const parse = p => p.split('.').map(s=>/^\d+$/.test(s)?+s:s);
  const get = (o,p) => parse(p).reduce((a,k)=>a==null?a:a[k], o);
  const set = (o,p,v) => { const ks=parse(p); let a=o; for(let i=0;i<ks.length-1;i++){ if(a[ks[i]]==null) a[ks[i]]=typeof ks[i+1]==='number'?[]:{}; a=a[ks[i]]; } a[ks[ks.length-1]]=v; };

  /* ---------- storage ---------- */
  const load = () => { try{ const r=localStorage.getItem(cfg.storageKey); if(r) return JSON.parse(r); }catch(e){ console.warn('CMS.load',e); } return clone(cfg.defaultContent); };
  const save = c => { try{ localStorage.setItem(cfg.storageKey, JSON.stringify(c)); return true; }
    catch(e){ console.warn('CMS.save',e); return false; } };
  const reset = () => { try{ localStorage.removeItem(cfg.storageKey); }catch(e){} return clone(cfg.defaultContent); };
  const exportJSON = c => { const blob=new Blob([JSON.stringify(c,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='content.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); };
  const importJSON = file => new Promise((res,rej)=>{ const r=new FileReader();
    r.onload=()=>{ try{ res(JSON.parse(r.result)); }catch(e){ rej(e); } }; r.onerror=rej; r.readAsText(file); });

  /* ---------- inline-edit bindings (emitted by section renderers) ---------- */
  const setEdit = v => { EDIT=!!v; };
  const bind = type => p => (EDIT && p) ? ` data-${type}="${p}"` : '';
  const e=bind('e'), img=bind('img'), icon=bind('icon'), list=bind('list'), item=bind('item'), rate=bind('rate'), cat=bind('catsel');

  /* ---------- theme tokens -> CSS custom properties (convention: camelCase -> --kebab) ---------- */
  function applyTheme(t){
    if(!t) return; const r=document.documentElement.style;
    if(t.colors) Object.keys(t.colors).forEach(k=>{ if(t.colors[k]) r.setProperty('--'+kebab(k), t.colors[k]); });
    if(t.fonts){
      if(t.fonts.heading) r.setProperty('--font-heading', '"'+t.fonts.heading+'"');
      if(t.fonts.body)    r.setProperty('--font-body', '"'+t.fonts.body+'"');
      injectFonts(t.fonts.heading, t.fonts.body);
    }
    if(t.radius!=null) r.setProperty('--radius-base', t.radius+'px');
  }
  function injectFonts(heading, body){
    const fams=[]; if(heading) fams.push(heading.replace(/ /g,'+')+':wght@500;600;700');
    if(body && body!==heading) fams.push(body.replace(/ /g,'+')+':wght@400;500;600;700;800');
    if(!fams.length) return; let link=document.getElementById('cms-fonts');
    if(!link){ link=document.createElement('link'); link.id='cms-fonts'; link.rel='stylesheet'; document.head.appendChild(link); }
    link.href='https://fonts.googleapis.com/css2?family='+fams.join('&family=')+'&display=swap';
  }

  return {
    configure: o => { cfg = Object.assign(cfg, o||{}); },
    get config(){ return cfg; },
    get edit(){ return EDIT; },
    clone, esc, parse, get, set, load, save, reset, exportJSON, importJSON,
    setEdit, applyTheme, bindings:{e,img,icon,list,item,rate,cat},
  };
})();
