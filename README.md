# CV. Perdana Jaya Aspal — Landing Page + Admin CMS

Landing page modular berbasis data, plus admin panel visual (gaya Elementor) **tanpa backend/database**. Semua konten, gambar, warna, font, dan urutan section diatur lewat satu file data + editor visual.

## Struktur — engine portable (`cms/`) + project (`site/`)

```
perdana-jaya-landing/
├── index.html              # Landing page publik (tanpa tombol admin)
├── adminpanel/index.html   # Editor visual inline → domain.com/adminpanel
│
├── cms/                    # 🔌 CORE PORTABLE — copy ke project lain apa adanya
│   ├── cms.js              # window.CMS: config, storage, path, tema, edit-binding
│   ├── render.js           # mesin render: data → HTML (header/footer/section via registry)
│   ├── edit.js             # overlay inline-edit (klik teks/gambar, toolbar section/item)
│   ├── admin.js            # controller admin (data + picker + tema)
│   ├── admin.css
│   └── README.md           # 📖 panduan plug-and-play (untuk dev / AI)
│
├── site/                   # 🎨 PROJECT INI — yang diganti kalau bikin web lain
│   ├── config.js           # CMS.configure({...})  ← satu-satunya lem
│   ├── content.js          # DEFAULT_CONTENT (konten awal)
│   ├── sections.js         # REGISTRY section (+ header/footer) — tambah section = 1 modul
│   ├── icons.js            # ikon SVG + glyph WhatsApp
│   ├── images.js           # daftar gambar untuk picker
│   ├── theme.css           # design token (warna/font/radius)
│   └── styles.css          # style semua section
│
├── data/content.default.json  # sumber konten (referensi; bisa di-replace hasil Export)
└── assets/img/             # 91 foto proyek
```

> **Plug & play:** untuk bikin web lain, copy folder `cms/` apa adanya, lalu tulis
> folder `site/` baru (konten + section + tema). Panduan lengkap: [`cms/README.md`](cms/README.md).

## Cara menjalankan (disarankan lewat server lokal)

```bash
cd perdana-jaya-landing
node serve.mjs          # ← disarankan: server ini mengaktifkan tombol "Publish" 1-klik
# atau: python3 -m http.server   (tanpa Publish; pakai Export lalu upload manual)
```

- Landing page : http://localhost:8000/
- Admin panel  : http://localhost:8000/adminpanel/

> **Publish 1-klik** hanya jalan lewat `node serve.mjs` (server menulis `site/content.js`).
> Di hosting statis biasa, tombol Publish otomatis jadi **download `content.js`** untuk di-upload manual.

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

Semua perubahan **tersimpan otomatis** ke browser (atau tekan ⌘/Ctrl+S).

## Publish perubahan

- **Cara 1 — tombol Publish (1 klik).** Jalankan `node serve.mjs`, lalu di admin klik
  **Publish**. Server menulis ulang `site/content.js` → perubahan langsung tayang untuk
  semua pengunjung. Tinggal upload folder ke hosting.
- **Cara 2 — manual (hosting statis).** Klik **Export** (dapat `content.json`), lalu
  regenerate seed:
```bash
python3 - content.json <<'PY'
import json
d=json.load(open("content.json"))
open("site/content.js","w").write("/* AUTO-GENERATED */\nwindow.DEFAULT_CONTENT = "+json.dumps(d,ensure_ascii=False,indent=2)+";\n")
PY
```

## Menambah section baru (modular)

Tambahkan satu entri di `site/sections.js` (pakai binding `CMS.bindings` untuk inline-edit):

```js
window.SECTIONS['fitur'] = {
  label:'Fitur', icon:'✨',
  render(d, site, P){            // P = path konten, mis. "sections.3.data"
    const {e:A} = CMS.bindings, esc = CMS.esc;
    return `<section class="section"><h2${A(P+'.title')}>${esc(d.title)}</h2></section>`;
  }
};
```

Lalu tambah objek `{ "id":"sec-fitur", "type":"fitur", "enabled":true, "data":{...} }`
ke array `sections`. Otomatis muncul di LP **dan** bisa diedit inline di admin.

## Bikin web lain pakai engine ini (template)

Copy folder `cms/` apa adanya → tulis folder `site/` baru → selesai.
Panduan langkah-demi-langkah: **[`cms/README.md`](cms/README.md)**.
