// Infinite, draggable canvas of graphic design work (wraps in both directions).
import { boot, gsap, $, $$, openModal, lenis, isTouch, reduceMotion } from '../core/app.js';
import { graphics } from '../data.js';

const root = $('#gfx'), plane = $('#plane');
$('#gCount').textContent = graphics.length;

let tiles = [], BW = 0, BH = 0, spanX = 0, spanY = 0, colW = 0, gap = 0;

function build() {
  const vw = innerWidth, vh = innerHeight;
  colW = vw < 700 ? 150 : vw < 1200 ? 220 : 270;
  gap = vw < 700 ? 14 : 26;
  const cols = 8;
  // masonry block
  const heights = new Array(cols).fill(0);
  const block = graphics.map((g, i) => {
    const c = heights.indexOf(Math.min(...heights));
    const h = Math.round(colW * (g.h / g.w));
    const t = { i, x: c * (colW + gap) + (c % 2 ? 0 : 0), y: heights[c] + (c % 2 ? colW * 0.4 : 0), w: colW, h };
    heights[c] += h + gap;
    return t;
  });
  BW = cols * (colW + gap);
  BH = Math.max(...heights) + colW * 0.4;
  const cx = Math.ceil(vw / BW) + 1, cy = Math.ceil(vh / BH) + 1;
  spanX = BW * cx; spanY = BH * cy;
  plane.innerHTML = '';
  tiles = [];
  for (let a = 0; a < cx; a++) for (let b = 0; b < cy; b++) {
    block.forEach((t) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'gfx__tile';
      el.dataset.i = t.i;
      el.style.width = `${t.w}px`; el.style.height = `${t.h}px`;
      el.innerHTML = `<img src="${graphics[t.i].src}" alt="Graphic design ${t.i + 1}" loading="lazy" decoding="async" draggable="false" />`;
      plane.append(el);
      tiles.push({ el, x: t.x + a * BW, y: t.y + b * BH, w: t.w, h: t.h });
    });
  }
}

// motion state
let ox = -innerWidth * 0.2, oy = -innerHeight * 0.3, vx = 0, vy = 0;
let dragging = false, moved = 0, lx = 0, ly = 0, zoom = 1, zoomT = 1, intro = 0;
const wrap = (v, span, size) => ((((v + size) % span) + span) % span) - size;

function render() {
  const vw = innerWidth, vh = innerHeight, cxp = vw / 2, cyp = vh / 2;
  zoom += (zoomT - zoom) * 0.1;
  for (const t of tiles) {
    const x = wrap(t.x + ox, spanX, t.w + gap);
    const y = wrap(t.y + oy, spanY, t.h + gap);
    // a gentle lens: tiles far from the centre shrink a touch
    const dx = (x + t.w / 2 - cxp) / vw, dy = (y + t.h / 2 - cyp) / vh;
    const lens = 1 - Math.min(0.12, (dx * dx + dy * dy) * 0.18);
    const s = lens * zoom * (0.6 + 0.4 * intro);
    const px = cxp + (x + t.w / 2 - cxp) * zoom - t.w / 2;
    const py = cyp + (y + t.h / 2 - cyp) * zoom - t.h / 2;
    if (px > vw + 40 || py > vh + 40 || px + t.w < -40 || py + t.h < -40) { if (t.vis !== false) { t.el.style.visibility = 'hidden'; t.vis = false; } continue; }
    if (t.vis === false) { t.el.style.visibility = ''; t.vis = true; }
    t.el.style.transform = `translate3d(${px}px,${py}px,0) scale(${s})`;
  }
}

gsap.ticker.add(() => {
  if (!dragging) {
    ox += vx; oy += vy;
    vx *= 0.93; vy *= 0.93;
    if (!reduceMotion && Math.abs(vx) + Math.abs(vy) < 0.05) { ox -= 0.18; oy -= 0.1; } // slow drift
  }
  zoomT = dragging ? 0.92 : 1;
  render();
});

root.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.gfx__card, .gfx__title')) return;
  dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; vx = vy = 0;
  root.setPointerCapture(e.pointerId);
});
root.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lx, dy = e.clientY - ly;
  lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
  ox += dx; oy += dy; vx = dx; vy = dy;
});
const end = (e) => {
  if (!dragging) return;
  dragging = false;
  if (moved < 6) {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.gfx__tile');
    if (el) openModal(graphics.map((g) => ({ type: 'image', src: g.src })), +el.dataset.i);
  }
};
root.addEventListener('pointerup', end);
root.addEventListener('pointercancel', () => { dragging = false; });
root.addEventListener('wheel', (e) => { e.preventDefault(); vx -= e.deltaX * 0.08; vy -= e.deltaY * 0.08; }, { passive: false });
addEventListener('keydown', (e) => {
  const k = { ArrowLeft: [30, 0], ArrowRight: [-30, 0], ArrowUp: [0, 30], ArrowDown: [0, -30] }[e.key];
  if (k && !document.querySelector('.modal.is-open')) { vx += k[0] * 0.3; vy += k[1] * 0.3; }
});
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 200); });

build();
render();
boot({
  page: 'graphics',
  onEnter() {
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
    gsap.to({ v: 0 }, { v: 1, duration: 1.8, ease: 'expo.out', onUpdate() { intro = this.targets()[0].v; } });
    gsap.fromTo(plane, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 });
    vx = isTouch ? -6 : -14; vy = -8;
  },
});
