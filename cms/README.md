# Mini-CMS — portable inline-editing engine

A backend-less, dependency-free CMS you can drop into **any** static site.
It gives you: a data-driven page renderer + an **inline visual editor**
(`/adminpanel`, Elementor-style: click text to edit, hover images to
replace, drag-free reorder, theme editor) with **localStorage autosave +
JSON export/import**. No build step, no framework, no server.

> This `/cms` folder is 100% project-agnostic. Everything specific to a
> website lives in a sibling `/site` folder. To reuse: copy `/cms`, write a
> new `/site`, done.

---

## 1. Architecture (separation of concerns)

```
cms/                  ← PORTABLE CORE (copy as-is, never edit per project)
  cms.js              window.CMS: config, storage, path get/set, theme, edit bindings
  render.js           CMS.render(content): data -> DOM (header/footer/sections via registry)
  edit.js             CMS.initEdit(): inline editing overlay (runs inside preview iframe)
  admin.js            admin controller (owns data, applies inline edits, pickers, theme)
  admin.css           admin shell styles

site/                 ← PROJECT (write this per website)
  config.js           CMS.configure({...})  ← the only glue
  content.js          window.DEFAULT_CONTENT = {...}  (seed data)
  sections.js         window.SECTIONS = {...}  (section registry: render + fields)
  icons.js            window.ICONS / window.WA_GLYPH  (optional icon set)
  images.js           window.IMAGE_LIST = [...]  (image library for the picker)
  theme.css           :root design tokens (--navy, --font-heading, …)
  styles.css          section styles

index.html            public page  (loads cms + site, calls CMS.render)
adminpanel/index.html editor        (loads cms + site, loads cms/admin.js)
```

**Data flow:** `content.js` (seed) → `CMS.load()` (localStorage or seed) →
`CMS.render()` → DOM. In the admin, the page is rendered inside an iframe in
*edit mode*; the overlay posts every change to the admin, which mutates the
content object and autosaves.

---

## 2. Plug into a new project (checklist for a human or an AI)

1. **Copy** the `cms/` folder into the project unchanged.
2. **Create `site/`** with:
   - `content.js` — `window.DEFAULT_CONTENT = { site, theme, nav, sections:[...], footer }`
   - `sections.js` — `window.SECTIONS = { <type>: { label, icon, fields, render } }`
   - `theme.css` + `styles.css` — your design (tokens + section CSS)
   - `icons.js`, `images.js` — optional
3. **Wire it** in `site/config.js`:
   ```js
   CMS.configure({
     mount: '#app',
     storageKey: 'YOURSITE_v1',          // unique per site
     defaultContent: window.DEFAULT_CONTENT,
     sections: window.SECTIONS,
     images: window.IMAGE_LIST,
   });
   ```
4. **index.html** — load order matters:
   ```html
   <div id="app"></div>
   <script src="cms/cms.js"></script>
   <script src="site/icons.js"></script>
   <script src="site/content.js"></script>
   <script src="site/images.js"></script>
   <script src="site/sections.js"></script>
   <script src="site/config.js"></script>
   <script src="cms/render.js"></script>
   <script src="cms/edit.js"></script>
   <script>
     if (window.parent !== window) parent.postMessage({type:'cms-frame-ready'},'*');
     else CMS.render(CMS.load(), {});
   </script>
   ```
5. **adminpanel/index.html** — copy this project's one; it loads the same
   `cms/` + `site/` files plus `cms/admin.js`. No changes needed except paths.

That's it. Open `/adminpanel` and edit.

---

## 3. The section registry (the one extension point)

Each entry renders HTML and declares inline-edit bindings via `CMS.bindings`.

```js
const { e:A, img:IMG, icon:ICO, list:LIST, item:ITEM } = CMS.bindings;
const esc = CMS.esc;

window.SECTIONS = {
  hero: {
    label: 'Hero', icon: '🏁',
    render(d, site, P) {            // P = base content path, e.g. "sections.3.data"
      return `<section class="hero">
        <h1${A(P+'.title')}>${esc(d.title)}</h1>
        <img src="${esc(d.image)}"${IMG(P+'.image')}>
      </section>`;
    }
  },
  // header & footer are just registry entries flagged chrome:true
  header: { chrome:true, render(c,{edit}){ return `<header>…</header>`; } },
  footer: { chrome:true, render(c,{edit}){ return `<footer>…</footer>`; } },
};
```

**Binding helpers** (only emit attributes in edit mode):

| helper | attribute | makes editable |
|--------|-----------|----------------|
| `CMS.bindings.e(path)`    | `data-e`       | text (contenteditable) |
| `CMS.bindings.img(path)`  | `data-img`     | image (put on `<img>`) |
| `CMS.bindings.icon(path)` | `data-icon`    | icon (icon picker) |
| `CMS.bindings.list(path)` | `data-list`    | array container (shows "＋ Tambah") |
| `CMS.bindings.item(path)` | `data-item`    | array item (shows ↑ ↓ ✕) |
| `CMS.bindings.rate(path)` | `data-rate`    | star rating |
| `CMS.bindings.cat(path)`  | `data-catsel`  | gallery category dropdown |

`render` must return **one top-level `<section>`** (the engine injects
`data-secidx`/`data-sectype` onto it). `chrome:true` entries (header/footer)
render fixed top/bottom and are excluded from the "＋ Section" menu.

---

## 4. Theme contract

- **Tokens:** `content.theme.colors` keys map to CSS vars by camelCase→kebab
  (`bgSoft` → `--bg-soft`). `theme.fonts.{heading,body}` → `--font-heading/-body`
  (Google Fonts auto-injected). `theme.radius` → `--radius-base`.
- **Behavior classes** the engine wires automatically — use them in your CSS/markup:
  `wa-link` (WhatsApp href), `gal-filter button[data-filter]` + `gal-item[data-cat]`
  (gallery filter), `gal-item` (lightbox), `reveal` (scroll-in animation),
  `tilt` (pointer tilt), `.stat .num` (count-up).

---

## 5. Publish (no database)

Edits live in the editor's browser (localStorage). To publish for visitors:

1. In `/adminpanel` → **⬇ Export** → downloads `content.json`.
2. Regenerate the seed and upload:
   ```bash
   python3 - content.json <<'PY'
   import json,sys
   d=json.load(open(sys.argv[1]))
   open("site/content.js","w").write("window.DEFAULT_CONTENT = "+json.dumps(d,ensure_ascii=False,indent=2)+";\n")
   PY
   ```
3. Upload the folder to any static host. `/adminpanel` keeps working there for
   future edits (it has `noindex`, and there is **no link to it** from the site).

> Want true 1-click publish? Add a tiny Node endpoint that writes `site/content.js`
> on Export. The core stays unchanged — only the admin's Export handler changes.

---

## 6. Message protocol (admin ↔ preview iframe)

| message | direction | payload |
|---------|-----------|---------|
| `cms-frame-ready` | preview → admin | — (iframe loaded, request content) |
| `cms-render`      | admin → preview | `{content, edit}` |
| `cms-edit`        | preview → admin | `{op:'text'|'image'|'icon'|'item'|'section', …}` |
