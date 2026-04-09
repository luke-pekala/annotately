# Annotately

> A browser-based PDF and image annotation tool. Open a file, pick a tool, and annotate with precision — highlights, notes, shapes, freehand drawing, and more. No upload required, no server needed.

[![Deploy to GitHub Pages](https://github.com/luke-pekala/annotately/actions/workflows/deploy.yml/badge.svg)](https://github.com/luke-pekala/Annotately/actions/workflows/deploy.yml)

**Live App** — [luke-pekala.github.io/annotately](https://luke-pekala.github.io/annotately/)

---

## What It Does

Annotately lets you annotate PDFs and images entirely in the browser. Open a file via drag & drop or the file picker, choose a tool from the sidebar, and start marking up your document. All annotation data persists across sessions via `localStorage` and can be exported as JSON.

It supports two document types:

- **PDF** — multi-page navigation, page selector, scroll-to-zoom
- **Image** — PNG, JPG, WebP, GIF, SVG

Annotation tools available:

- Highlight, Underline, Strikethrough (text markup)
- Sticky Notes with editable text
- Rectangle & Ellipse shapes
- Arrow
- Freehand drawing
- Text labels
- Eraser

Additional features: click-to-select & inline comment editing, annotation search & filter sidebar, undo/redo (up to 20 steps), zoom controls, color picker (7 presets), stroke width selector, and JSON export.

---

## Stack

- React 18 · TypeScript · Vite 5
- Zustand (with `persist` middleware for localStorage)
- react-pdf + pdfjs-dist (PDF rendering)
- Tailwind CSS v3 · Framer Motion · lucide-react
- Deploys automatically via GitHub Actions → GitHub Pages

---

## Features

- **PDF & image support** — open any PDF or raster/vector image via drag & drop
- **10 annotation tools** — from text markup to freehand drawing
- **Sidebar** with Annotations, Pages, and Comments tabs; search & filter
- **Persistent state** — annotations survive page refresh via `localStorage`
- **Undo / Redo** — up to 20 steps (`Ctrl/⌘+Z` / `Ctrl/⌘+Shift+Z`)
- **Zoom** — scroll-to-zoom (`Ctrl+Wheel`), zoom controls, reset
- **Color picker** — 7 preset colours with per-annotation colour support
- **Export** — download all annotation data as a `.json` file
- **Keyboard shortcuts** — full shortcut set for every tool
- **Dark-first design** — refined ink/amber palette

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | Select tool |
| `H` | Pan tool |
| `N` | Sticky Note |
| `R` | Rectangle |
| `E` | Ellipse |
| `A` | Arrow |
| `F` | Freehand draw |
| `T` | Text label |
| `X` | Eraser |
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Shift + Z` | Redo |
| `Ctrl/⌘ + +` | Zoom in |
| `Ctrl/⌘ + -` | Zoom out |
| `Ctrl/⌘ + 0` | Reset zoom |

---

## Local Development

Requires Node.js ≥ 18 and npm ≥ 9.

```bash
git clone https://github.com/luke-pekala/Annotately.git
cd Annotately
npm install
npm run dev
```

Open [http://localhost:5173/annotately/](http://localhost:5173/annotately/)

```bash
npm run build       # production build
npm run preview     # preview the production build locally
```

---

## Deployment

The repo includes a GitHub Actions workflow that builds and deploys to GitHub Pages on every push to `main`.

**One-time setup:**

1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Under *Source*, select **GitHub Actions**
4. The next push to `main` deploys to `https://luke-pekala.github.io/annotately/` automatically

For Vercel or Netlify deployments, set the build command to `npm run build`, output/publish directory to `dist`, and update `base` in `vite.config.ts` from `/annotately/` to `/`.

---

## Project Structure

```
Annotately/
├── .github/workflows/deploy.yml   # CI/CD → GitHub Pages
├── public/
├── src/
│   ├── components/
│   │   ├── Canvas/                # SVG annotation renderer, canvas area, page nav
│   │   ├── Sidebar/               # Annotations / pages / comments tabs
│   │   ├── Toolbar/               # Vertical tool palette
│   │   ├── Header.tsx             # Logo, doc tabs, undo/redo, zoom, export
│   │   └── WelcomeScreen.tsx      # Empty-state drop zone
│   ├── hooks/
│   │   ├── useAnnotationDraw.ts   # Drawing state machine
│   │   └── useFileOpen.ts         # File open helper
│   ├── store/index.ts             # Zustand store + selectors
│   ├── styles/globals.css         # Tailwind + CSS vars + utilities
│   ├── types/index.ts             # All TypeScript types
│   └── utils/index.ts             # Export, format, color helpers
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## License

MIT
