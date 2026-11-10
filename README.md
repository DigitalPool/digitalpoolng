# DigitalPool website

Multi-page static site for digitalpoolng.com. Vite + Three.js (WebGL) + GSAP + Lenis. No database, no server.

## Pages
| URL | File | What's on it |
| --- | --- | --- |
| `/` | `index.html` · `src/pages/home.js` | Interactive pool hero, showreel, work list, services, graphics rail, motion |
| `/work` | `work.html` · `src/pages/work.js` | All projects, filters, grid/list views |
| `/case?p=<slug>` | `case.html` · `src/pages/case.js` | Case study template, filled from `src/data.js` |
| `/about` | `about.html` · `src/pages/about.js` | Ink-fluid hero, manifesto, process, team |
| `/graphics` | `graphics.html` · `src/pages/graphics.js` | Infinite draggable archive of graphic design |
| `/motion` | `motion.html` · `src/pages/motion.js` | Motion pieces with hover previews and sound |
| `/contact` | `contact.html` · `src/pages/contact.js` | Pool hero and a brief form (opens the visitor's email app) |

Header, footer, cursor, preloader and page transition are shared partials in `partials/`.

## Edit content
Everything (projects, services, team, graphics, motion, links, Fiverr URL) is in `src/data.js`.

- Project media lives in `public/assets/work/<slug>/` (`cover.webp`, `preview.mp4`, `shot-XX.webp`, `mobile.webp`).
- Graphics: `public/assets/graphics/gNN.webp`. Add a file, then add its `[width, height]` to `gsz` in `data.js`.
- Motion: `public/assets/motion/<id>.mp4` (6s silent loop), `<id>-full.mp4` (15s with sound), `<id>.jpg` (poster).
- Showreel: `public/assets/video/reel.mp4` (desktop), `reel-sm.mp4` (mobile), `reel-poster.jpg`.
- Fiverr button on the contact page: paste your agency URL into `site.fiverr`.
- Colours and type: tokens at the top of `src/styles/main.css`.
- The 3D pool: `src/gl/pool.js` (objects are in `layout()`); the ink effect: `src/gl/ink.js`.

Keep every file under 25 MB (Cloudflare's per-file limit).

## Run and build
```
npm install
npm run dev      # local preview at http://localhost:5173
npm run build    # outputs dist/
npm run preview  # serve dist/ locally
```

## Deploy on Cloudflare (free)
1. Cloudflare dashboard > Workers & Pages > Create > Pages > Upload assets.
2. Upload the `dist` folder.
3. Settings > Custom domains > add `digitalpoolng.com` (and `www.digitalpoolng.com`).

Cloudflare serves `/work` from `work.html` automatically, so the clean links work as is.
# digitalpoolng

## Contact form (sends briefs + attachments)
The form posts to `/api/brief`, handled by `worker/index.js`. It validates and sanitises every field,
then emails the brief (with up to 5 attachments, 10 MB each / 20 MB total) through Resend:
from `website@digitalpoolng.com` to `hello@digitalpoolng.com`, with the visitor's email as reply-to.

Email routing (hello@ to Gmail) and the Resend domain are already set up; no DNS changes are needed.
The Worker reads the Resend key only from the `RESEND_API_KEY` secret in Cloudflare. Never put it in code or a committed file.

Setup:
1. Resend > API Keys > Create API key (permission: Sending access, domain: digitalpoolng.com). Copy it.
2. Cloudflare > Workers & Pages > digitalpoolng > Settings > Variables and Secrets > Add: type **Secret**, name `RESEND_API_KEY`, paste the key, save.
3. Push to GitHub; Cloudflare rebuilds and deploys.

Optional variables: `BRIEF_TO` (default hello@digitalpoolng.com), `BRIEF_FROM` (default `DigitalPool website <website@digitalpoolng.com>`).
Until the secret is set, the form tells visitors it couldn't send and offers a pre-filled email link to hello@digitalpoolng.com.

Local testing: put `RESEND_API_KEY=...` in `.dev.vars` (git-ignored), run `npm run build && npx wrangler dev` (port 8787) and `npm run dev`; the dev server proxies `/api` to the Worker.
