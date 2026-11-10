// Floating media preview that follows the cursor over a list, tilting with velocity.
import { gsap, $, isTouch } from './app.js';

export function hoverPreview(container, rowSelector = '[data-preview]') {
  const hp = $('.hp'), inner = $('.hp__inner');
  if (!hp || isTouch) return;
  const media = new Map();
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, rot = 0, on = false, current = null;
  gsap.set(inner, { scale: 0 });
  const scaleTo = (v) => gsap.to(inner, { scale: v, duration: v ? 0.7 : 0.45, ease: v ? 'expo.out' : 'power3.in', overwrite: true });

  function get(row) {
    if (media.has(row)) return media.get(row);
    let el;
    if (row.dataset.preview) {
      el = document.createElement('video');
      Object.assign(el, { muted: true, loop: true, playsInline: true, preload: 'auto', src: row.dataset.preview });
      if (row.dataset.cover) el.poster = row.dataset.cover;
    } else {
      el = new Image(); el.src = row.dataset.cover; el.alt = '';
    }
    inner.append(el);
    media.set(row, el);
    return el;
  }
  function activate(row) {
    const el = get(row);
    if (current && current !== el) { current.classList.remove('is-on'); current.pause?.(); }
    current = el;
    el.classList.add('is-on');
    el.play?.().catch(() => {});
    if (!on) { on = true; x = tx; y = ty; scaleTo(1); }
  }
  function hide() {
    on = false; scaleTo(0);
    current?.pause?.();
  }
  container.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  container.querySelectorAll(rowSelector).forEach((row) => row.addEventListener('pointerenter', () => activate(row)));
  container.addEventListener('pointerleave', hide);
  addEventListener('scroll', () => { if (on && !container.matches(':hover')) hide(); }, { passive: true });

  gsap.ticker.add(() => {
    const dx = tx - x;
    x += dx * 0.12; y += (ty - y) * 0.12;
    rot += (Math.max(-14, Math.min(14, dx * 0.06)) - rot) * 0.12;
    hp.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg)`;
  });
}

// cards that play their video while hovered (or while visible on touch screens)
export function hoverVideos(cards) {
  cards.forEach((card) => {
    const v = card.querySelector('video');
    if (!v) return;
    if (isTouch) {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { v.play().then(() => card.classList.add('is-playing')).catch(() => {}); } else { v.pause(); }
      }, { threshold: 0.6 });
      io.observe(card);
      return;
    }
    card.addEventListener('pointerenter', () => { v.preload = 'auto'; v.play().then(() => card.classList.add('is-playing')).catch(() => {}); });
    card.addEventListener('pointerleave', () => { v.pause(); card.classList.remove('is-playing'); });
  });
}
