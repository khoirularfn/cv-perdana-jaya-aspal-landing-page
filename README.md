# CV. Perdana Jaya Aspal — Landing Page + Admin CMS

Landing page modular berbasis data, plus admin panel visual (gaya Elementor) **tanpa backend/database**. Semua konten, gambar, warna, font, dan urutan section diatur lewat satu file data + editor visual.

## Struktur

```
perdana-jaya-landing/
├── index.html              # Landing page publik (tanpa tombol admin)
├── adminpanel/
│   ├── index.html          # Editor visual  →  domain.com/adminpanel
│   ├── admin.js
│   └── admin.css
├── assets/
│   ├── css/theme.css       # Design token (warna, font, radius) — diubah dari admin
│   ├── css/styles.css      # Semua style section
│   ├── js/icons.js         # Library ikon SVG
│   ├── js/content.default.js  # Konten awal (di-embed agar jalan via file://)
│   ├── js/images.js        # Daftar gambar untuk image picker
│   ├── js/store.js         # Layer data (localStorage + export/import)
│   ├── js/sections.js      # REGISTRY section — tambah section = tambah 1 modul di sini
│   └── js/render.js        # Mesin render: data → HTML
├── data/content.default.json  # Sumber konten (referensi; bisa di-replace hasil Export)
└── assets/img/             # 91 foto proyek
```

## Cara menjalankan (disarankan lewat server lokal)

```bash
cd perdana-jaya-landing
python3 -m http.server
```

- Landing page : http://localhost:8000/
- Admin panel  : http://localhost:8000/adminpanel/

> Bisa juga dibuka langsung (double-click `index.html`), tapi **untuk menyimpan** perubahan di admin, gunakan server lokal atau tombol **Export JSON** (localStorage sering diblokir di mode `file://`).

## Cara pakai admin (edit LANGSUNG di halaman — gaya Elementor)

Buka `/adminpanel`. Yang tampil adalah halaman aslinya yang bisa langsung diedit:

- **Teks** — klik teksnya, langsung ketik. Otomatis tersimpan.
- **Gambar** — arahkan kursor ke gambar → tombol **🖼️ Ganti Gambar** → pilih dari galeri 91 foto atau **Upload** (otomatis dikompres).
- **Ikon** — klik ikon di kartu layanan/keunggulan → pilih ikon baru.
- **Bintang testimoni** — klik bintang ke berapa untuk set rating.
- **Kartu (layanan/galeri/testimoni/dst)** — arahkan kursor → tombol **↑ ↓ ✕** untuk pindah/hapus; tombol **＋ Tambah** di akhir tiap daftar.
- **Section** — arahkan kursor ke pojok kanan atas section → **pindah ↑↓**, **sembunyikan 👁**, **hapus 🗑**.
- **＋ Section** (toolbar) — tambah section baru dari daftar modul.
- **🎨 Tema** (toolbar) — ubah warna brand, font, dan kelengkungan sudut, preview langsung.
- **🖥/📱** — pratinjau tampilan desktop vs HP.

Semua perubahan **tersimpan otomatis** ke browser (atau tekan ⌘/Ctrl+S). Untuk publish ke pengunjung, klik **⬇ Export** lalu ikuti langkah di bawah.

## Publish perubahan

Karena tanpa database, alur publish:
1. Edit di admin → **Export JSON** (dapat file `content.json`).
2. Jalankan: `node tools/apply-content.js content.json` *(atau)* timpa `assets/js/content.default.js`
   dengan menjalankan generator di bawah, lalu upload folder ke hosting statis.

Generator embed (regenerate `content.default.js` dari sebuah `content.json`):
```bash
python3 - "$PWD/content.json" <<'PY'
import json,sys
d=json.load(open(sys.argv[1]))
open("assets/js/content.default.js","w").write(
 "/* AUTO-GENERATED */\nwindow.DEFAULT_CONTENT = "+json.dumps(d,ensure_ascii=False,indent=2)+";\n")
print("updated assets/js/content.default.js")
PY
```

## Menambah section baru (modular)

Tambahkan satu entри di `assets/js/sections.js`:

```js
window.SECTIONS['fitur'] = {
  label:'Fitur', icon:'✨',
  fields:[ {key:'title',label:'Judul',type:'text'}, /* ... */ ],
  render(d, site){ return `<section class="section">...</section>`; }
};
```

Lalu tambahkan objek `{ "id":"sec-fitur", "type":"fitur", "enabled":true, "data":{...} }`
ke array `sections` di konten. Otomatis muncul di LP **dan** di admin panel.
