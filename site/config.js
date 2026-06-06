/* ============================================================
   PROJECT WIRING — point the portable CMS core at THIS site.
   This is the only glue file. To reuse the engine elsewhere, copy
   /cms unchanged and write a config like this for the new project.
   ============================================================ */
CMS.configure({
  mount: '#app',                       // element the page renders into
  storageKey: 'perdana_jaya_v1',       // unique localStorage namespace per site
  defaultContent: window.DEFAULT_CONTENT, // seed content (site/content.js)
  sections: window.SECTIONS,           // section registry (site/sections.js)
  images: window.IMAGE_LIST,           // image library for the picker (site/images.js)
});
