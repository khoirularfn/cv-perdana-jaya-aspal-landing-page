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

  // Fields that aren't naturally inline (logo, link targets, SEO) get a
  // "⚙ Pengaturan" drawer in the admin. Each entry binds to a content path.
  settings: [
    { key:'site.logo',           label:'Logo (kosongkan = pakai logo default)', type:'image' },
    { key:'site.brandName',      label:'Nama Brand',                 type:'text' },
    { key:'site.brandTagline',   label:'Tagline Brand',              type:'text' },
    { key:'site.waNumber',       label:'Nomor WhatsApp (link, mis. 6283…)', type:'text' },
    { key:'site.phone',          label:'Nomor telepon (tampil)',     type:'text' },
    { key:'site.waButtonLabel',  label:'Teks tombol WA di header',   type:'text' },
    { key:'site.waMessage',      label:'Pesan WhatsApp default',     type:'textarea' },
    { key:'site.title',          label:'Judul Halaman (SEO)',        type:'text' },
    { key:'site.description',    label:'Deskripsi (SEO)',            type:'textarea' },
  ],
});
