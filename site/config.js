/* ============================================================
   PROJECT WIRING — point the portable CMS core at THIS site.
   Uses the plug & play template's grouped-settings format.
   ============================================================ */
CMS.configure({
  mount: '#app',
  storageKey: 'perdana_jaya_v1',          // unique localStorage namespace per site
  defaultContent: window.DEFAULT_CONTENT,  // seed content (site/content.js)
  sections: window.SECTIONS,               // section registry (site/sections.js)
  images: window.IMAGE_LIST,               // image library for the picker (site/images.js)

  settings: [
    {
      type: 'group', title: 'Brand',
      description: 'Identitas utama yang tampil di header & footer.',
      fields: [
        { key: 'site.logo', label: 'Logo', type: 'image', help: 'Kosongkan untuk memakai logo default.' },
        { key: 'site.brandName', label: 'Nama brand', type: 'text', placeholder: 'PERDANA JAYA' },
        { key: 'site.brandTagline', label: 'Tagline singkat', type: 'text', placeholder: 'Aspal · Jabodetabek' }
      ]
    },
    {
      type: 'group', title: 'Kontak',
      description: 'Dipakai untuk tombol & link WhatsApp.',
      fields: [
        { key: 'site.waNumber', label: 'Nomor WhatsApp (link)', type: 'text', placeholder: '6283838781282', help: 'Format internasional tanpa + atau spasi.' },
        { key: 'site.phone', label: 'Nomor telepon (tampil)', type: 'text', placeholder: '0838-3878-1282' },
        { key: 'site.waButtonLabel', label: 'Teks tombol WA di header', type: 'text', placeholder: 'WhatsApp' },
        { key: 'site.waMessage', label: 'Pesan WhatsApp default', type: 'textarea', placeholder: 'Halo, saya ingin bertanya...' }
      ]
    },
    {
      type: 'group', title: 'Warna',
      description: 'Warna brand yang dipakai di seluruh website.',
      fields: [
        { key: 'theme.colors.wa', label: 'Tombol WhatsApp', type: 'color' },
        { key: 'theme.colors.blue', label: 'Aksen / tombol utama', type: 'color' },
        { key: 'theme.colors.navy', label: 'Warna gelap (navy)', type: 'color' },
        { key: 'theme.colors.amber', label: 'Highlight (amber)', type: 'color' }
      ]
    },
    {
      type: 'group', title: 'SEO',
      description: 'Judul tab browser & meta description.',
      fields: [
        { key: 'site.title', label: 'Judul halaman', type: 'text' },
        { key: 'site.description', label: 'Deskripsi halaman', type: 'textarea' }
      ]
    },
    {
      type: 'group', title: 'Navigasi',
      description: 'Atur menu utama; target otomatis dari section aktif.',
      fields: [
        { key: 'nav.links', label: 'Menu utama', type: 'navLinks' }
      ]
    },
    {
      type: 'group', title: 'Footer',
      description: 'Teks bagian bawah website.',
      fields: [
        { key: 'footer.about', label: 'Deskripsi footer', type: 'textarea' },
        { key: 'footer.areaTitle', label: 'Judul area layanan', type: 'text' },
        { key: 'footer.copyright', label: 'Copyright', type: 'text' },
        { key: 'footer.tagline', label: 'Tagline footer', type: 'text' }
      ]
    }
  ]
});
