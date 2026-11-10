import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

// Shared header/footer/overlays live in /partials and are injected into every page
// wherever an HTML file contains <!-- @include name -->.
const partials = () => ({
  name: 'dp-partials',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
        readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf8'),
      ),
  },
  handleHotUpdate({ file, server }) {
    if (file.includes('/partials/')) server.ws.send({ type: 'full-reload' });
  },
});

const pages = ['index', 'work', 'case', 'about', 'graphics', 'motion', 'contact', '404'];

export default defineConfig({
  plugins: [partials()],
  // the contact form posts to /api/brief; locally that's the Worker under `npx wrangler dev` (port 8787)
  server: { proxy: { '/api': 'http://localhost:8787' } },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}.html`)])),
    },
  },
});
