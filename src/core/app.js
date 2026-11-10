// Shared runtime for every page: smooth scroll, cursor, magnetic UI, liquid page
// transitions, preloader, scroll reveals, header, modal, clocks and small helpers.
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/archivo/standard-italic.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/main.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger, SplitText };

const html = document.documentElement;
export const isTouch = matchMedia('(hover: none)').matches;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export let lenis = null;

// ─── smooth scroll
function initScroll() {
  if (reduceMotion) return;
  lenis = new Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
export const scrollTo = (target, opts = {}) => {
  if (lenis) return lenis.scrollTo(target, { duration: 1.4, ...opts });
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
  else target?.scrollIntoView?.({ behavior: 'smooth' });
};
export const lockScroll = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); html.classList.toggle('is-locked', on); };

// ─── cursor
const cursor = { el: null, label: null, x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
export function setCursor(state, label = '') {
  if (!cursor.el) return;
  cursor.el.dataset.state = state || '';
  cursor.label.textContent = label;
}
function initCursor() {
  cursor.el = $('.cursor');
  if (!cursor.el || isTouch) { cursor.el?.remove(); cursor.el = null; return; }
  cursor.label = $('.cursor__label', cursor.el);
  const dot = $('.cursor__dot', cursor.el), ring = $('.cursor__ring', cursor.el);
  html.classList.add('has-cursor');
  addEventListener('pointermove', (e) => { cursor.x = e.clientX; cursor.y = e.clientY; cursor.el.classList.add('is-on'); }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.el.classList.remove('is-on'));
  addEventListener('pointerdown', () => cursor.el.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.el.classList.remove('is-down'));
  gsap.ticker.add(() => {
    cursor.rx += (cursor.x - cursor.rx) * 0.18;
    cursor.ry += (cursor.y - cursor.ry) * 0.18;
    dot.style.transform = `translate3d(${cursor.x}px,${cursor.y}px,0)`;
    ring.style.transform = `translate3d(${cursor.rx}px,${cursor.ry}px,0)`;
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, [role="button"], input, textarea, label');
    if (!t) return setCursor('');
    if (t.classList.contains('talk')) return setCursor('ball');
    if (t.dataset.cursor) return setCursor('label', t.dataset.cursor);
    if (t.matches('input, textarea')) return setCursor('text');
    setCursor('link');
  });
}

// ─── magnetic
function initMagnetic(root = document) {
  if (isTouch) return;
  $$('[data-magnetic]', root).forEach((el) => {
    if (el._mag) return; el._mag = true;
    const s = parseFloat(el.dataset.magnetic) || 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * s);
      yTo((e.clientY - (r.top + r.height / 2)) * s);
    });
    el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' }); });
  });
}

// ─── page transitions: a red liquid sheet that pours over the page
const tx = { el: null, path: null, mark: null, busy: false };
function edgeCover(t) { // sheet rising from bottom, bulging up in the middle
  const e = gsap.parseEase('power3.inOut')(t);
  const y0 = 100 - 100 * e, y1 = y0 - 22 * Math.sin(Math.PI * t);
  return `M0 ${y0} C 30 ${y1} 70 ${y1} 100 ${y0} L100 100 L0 100 Z`;
}
function edgeReveal(t) { // sheet leaving upward, its lower edge bulging
  const e = gsap.parseEase('power3.inOut')(t);
  const y0 = 100 - 100 * e, y1 = y0 - 22 * Math.sin(Math.PI * t);
  return `M0 0 L100 0 L100 ${y0} C 70 ${y1} 30 ${y1} 0 ${y0} Z`;
}
export function navigate(href) {
  if (tx.busy) return;
  tx.busy = true;
  try { sessionStorage.setItem('dp-tx', '1'); } catch {}
  lockScroll(true);
  const p = { t: 0 };
  tx.el.classList.add('is-active');
  gsap.timeline({ onComplete: () => { location.href = href; } })
    .to(p, { t: 1, duration: reduceMotion ? 0.01 : 0.9, ease: 'none', onUpdate: () => tx.path.setAttribute('d', edgeCover(p.t)) })
    .fromTo(tx.mark, { autoAlpha: 0, scale: 0.6, rotate: -20 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2)' }, 0.45)
    .to({}, { duration: 0.08 });
}
function revealFromTransition() {
  const p = { t: 0 };
  tx.el.classList.add('is-active');
  tx.path.setAttribute('d', edgeReveal(0));
  html.classList.remove('is-tx');
  try { sessionStorage.removeItem('dp-tx'); } catch {}
  gsap.set(tx.mark, { autoAlpha: 1 });
  return gsap.timeline({ onComplete: () => tx.el.classList.remove('is-active') })
    .to(tx.mark, { autoAlpha: 0, scale: 0.7, duration: 0.35, ease: 'power2.in' }, 0)
    .to(p, { t: 1, duration: reduceMotion ? 0.01 : 1.0, ease: 'none', onUpdate: () => tx.path.setAttribute('d', edgeReveal(p.t)) }, 0.15);
}
function initLinks() {
  tx.el = $('.tx'); tx.path = $('.tx__path'); tx.mark = $('.tx__mark');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTx !== undefined) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      e.preventDefault();
      if (url.hash) { const t = $(url.hash); if (t) scrollTo(t, { offset: -80 }); } else scrollTo(0);
      return;
    }
    e.preventDefault();
    closeMenu();
    navigate(url.href);
  });
  addEventListener('pageshow', (e) => {
    if (e.persisted) { tx.busy = false; tx.el.classList.remove('is-active'); tx.path.setAttribute('d', edgeCover(0)); lockScroll(false); }
  });
}

// ─── preloader (first visit in a session)
function runPreloader(tasks) {
  const pl = $('#pl');
  if (!html.classList.contains('is-first') || !pl) { pl?.remove(); return Promise.resolve(false); }
  try { sessionStorage.setItem('dp-visited', '1'); } catch {}
  lockScroll(true);
  const num = $('.pl__num', pl), fill = $('.pl__fill', pl), wave = $('.pl__wave', pl), words = $('.pl__words span', pl);
  const phrases = ['Diving in', 'Filling the pool', 'Stirring the water', 'Making waves'];
  let shown = 0, target = 0, done = 0;
  const total = tasks.length + 1;
  const bump = () => { done++; target = Math.max(target, (done / total) * 100); };
  tasks.forEach((p) => Promise.resolve(p).catch(() => {}).finally(bump));
  const minTime = new Promise((r) => setTimeout(r, reduceMotion ? 300 : 1900)).then(bump);
  return new Promise((resolve) => {
    let wi = 0;
    const wordT = setInterval(() => { wi = (wi + 1) % phrases.length; words.textContent = phrases[wi]; }, 700);
    const tick = () => {
      shown += (Math.max(target, shown + 0.15) - shown) * 0.08;
      if (target >= 100) shown += 0.6;
      shown = Math.min(shown, 100);
      num.textContent = Math.round(shown);
      fill.style.height = `${shown}%`;
      wave.style.bottom = `${shown}%`;
      if (shown >= 99.9) {
        gsap.ticker.remove(tick); clearInterval(wordT);
        num.textContent = '100';
        const tl = gsap.timeline({ onComplete: () => { pl.remove(); html.classList.remove('is-first'); } });
        tl.to('.pl__top, .pl__bottom', { autoAlpha: 0, y: -12, duration: 0.4, ease: 'power2.in' })
          .to('.pl__logo', { scale: 0.9, duration: 0.35, ease: 'power2.in' }, 0)
          .to('.pl__logo', { scale: 30, autoAlpha: 0, duration: 0.9, ease: 'expo.in' }, 0.35)
          .to(pl, { clipPath: 'circle(0% at 50% 50%)', duration: 1.0, ease: 'expo.inOut' }, 0.55)
          .add(() => { lockScroll(false); resolve(true); }, 0.95);
      }
    };
    gsap.ticker.add(tick);
    Promise.all([minTime]).then(() => {});
  });
}

// ─── header + menu
function initHeader(page) {
  const hdr = $('#hdr');
  $$(`[data-nav="${page}"]`, hdr).forEach((a) => a.classList.add('is-active'));
  let lastY = 0;
  const onScroll = (y) => {
    hdr.classList.toggle('is-scrolled', y > 40);
    if (!html.classList.contains('menu-open')) hdr.classList.toggle('is-hidden', y > 300 && y > lastY + 2);
    if (y < lastY - 2) hdr.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  const burger = $('.hdr__burger');
  burger.addEventListener('click', () => (html.classList.contains('menu-open') ? closeMenu() : openMenu()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}
function openMenu() {
  html.classList.add('menu-open'); lockScroll(true);
  $('.hdr__burger').setAttribute('aria-expanded', 'true'); $('#menu').setAttribute('aria-hidden', 'false');
  gsap.fromTo('.menu__nav a', { yPercent: 110 }, { yPercent: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out', delay: 0.2 });
}
function closeMenu() {
  if (!html.classList.contains('menu-open')) return;
  html.classList.remove('menu-open'); lockScroll(false);
  $('.hdr__burger').setAttribute('aria-expanded', 'false'); $('#menu').setAttribute('aria-hidden', 'true');
}

// ─── reveals
export function initReveals(root = document) {
  $$('[data-split]', root).forEach((el) => {
    if (el._split) return; el._split = true;
    const st = { trigger: el, start: 'top 90%', once: true };
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
      onSplit(self) {
        if (el.dataset.split === 'manual') { el._lines = self.lines; if (!el._entered) gsap.set(self.lines, { yPercent: 110 }); return; }
        return gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: parseFloat(el.dataset.delay) || 0, scrollTrigger: st });
      },
    });
  });
  $$('[data-reveal]', root).forEach((el) => {
    if (el._rev) return; el._rev = true;
    gsap.from(el, { y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', delay: parseFloat(el.dataset.delay) || 0, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  $$('[data-stagger]', root).forEach((el) => {
    if (el._stg) return; el._stg = true;
    gsap.from(el.children, { y: 50, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-fill]', root).forEach((el) => {
    if (el._fill) return; el._fill = true;
    const s = SplitText.create(el, { type: 'words', wordsClass: 'w' });
    gsap.fromTo(s.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });
  $$('[data-parallax]', root).forEach((el) => {
    const s = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-unveil]', root).forEach((el) => {
    if (el._unv) return; el._unv = true;
    const media = el.querySelector('img, video');
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      .fromTo(el, { clipPath: 'inset(18% 10% 18% 10% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.5, ease: 'expo.out' })
      .fromTo(media, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
  });
  $$('[data-count]', root).forEach((el) => {
    const end = parseFloat(el.dataset.count); const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v) + (el.dataset.suffix || ''); } });
  });
  $$('[data-marquee]', root).forEach(marquee);
  initMagnetic(root);
}

// velocity-reactive marquee
export function marquee(el) {
  if (el._mq) return; el._mq = true;
  const track = el.firstElementChild;
  track.append(...[...track.children].map((n) => n.cloneNode(true)));
  const dir = el.dataset.marquee === 'right' ? 1 : -1;
  let x = 0, boost = 0, skew = 0;
  const setSkew = gsap.quickSetter(track, 'skewX', 'deg');
  gsap.ticker.add((t, dt) => {
    const v = lenis ? lenis.velocity : 0;
    boost += (Math.abs(v) * 0.6 - boost) * 0.1;
    x += dir * (0.045 + boost * 0.02) * dt;
    const half = track.scrollWidth / 2;
    if (half) { if (x <= -half) x += half; if (x > 0) x -= half; }
    track.style.transform = `translate3d(${x}px,0,0)`;
    skew += ((lenis ? -v * 0.25 : 0) - skew) * 0.1;
    setSkew(Math.max(-12, Math.min(12, skew)));
  });
}

// ─── modal (video / image viewer)
const modal = { el: null, items: [], i: 0 };
export function openModal(items, index = 0) {
  modal.el = $('#modal'); modal.items = items; modal.i = index;
  renderModal();
  modal.el.classList.add('is-open'); modal.el.setAttribute('aria-hidden', 'false');
  lockScroll(true);
  $('.modal__nav', modal.el).hidden = items.length < 2;
  gsap.fromTo($('.modal__stage', modal.el), { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.7, ease: 'expo.out' });
  $('.modal__close', modal.el).focus({ preventScroll: true });
}
function renderModal() {
  const it = modal.items[modal.i], stage = $('.modal__stage', modal.el);
  stage.innerHTML = it.type === 'video'
    ? `<video src="${it.src}" ${it.poster ? `poster="${it.poster}"` : ''} controls autoplay playsinline ${it.muted ? 'muted' : ''} ${it.loop ? 'loop' : ''}></video>`
    : `<img src="${it.src}" alt="${it.alt || ''}" />`;
  if (it.caption) stage.insertAdjacentHTML('beforeend', `<p class="modal__cap mono">${it.caption}</p>`);
  $('.modal__count', modal.el).textContent = `${String(modal.i + 1).padStart(2, '0')} / ${String(modal.items.length).padStart(2, '0')}`;
}
export function closeModal() {
  if (!modal.el?.classList.contains('is-open')) return;
  modal.el.classList.remove('is-open'); modal.el.setAttribute('aria-hidden', 'true');
  $('.modal__stage', modal.el).innerHTML = '';
  lockScroll(false);
}
function initModal() {
  const el = $('#modal'); if (!el) return;
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('[data-next]')) { modal.i = (modal.i + 1) % modal.items.length; renderModal(); }
    if (e.target.closest('[data-prev]')) { modal.i = (modal.i - 1 + modal.items.length) % modal.items.length; renderModal(); }
  });
  addEventListener('keydown', (e) => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight' && modal.items.length > 1) { modal.i = (modal.i + 1) % modal.items.length; renderModal(); }
    if (e.key === 'ArrowLeft' && modal.items.length > 1) { modal.i = (modal.i - 1 + modal.items.length) % modal.items.length; renderModal(); }
  });
}

// ─── small things
export function toast(msg) {
  const t = $('.toast'); if (!t) return;
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 2200);
}
function initMisc() {
  $$('[data-year]').forEach((e) => (e.textContent = new Date().getFullYear()));
  const clocks = $$('[data-clock]');
  const tickClock = () => clocks.forEach((c) => {
    c.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: c.dataset.clock }).format(new Date());
  });
  tickClock(); setInterval(tickClock, 20000);
  document.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-copy]');
    if (c) { try { await navigator.clipboard.writeText(c.dataset.copy); toast('Email copied ✓'); } catch { location.href = `mailto:${c.dataset.copy}`; } }
    if (e.target.closest('[data-top]')) scrollTo(0, { duration: 2 });
  });
  // giant footer word rises as you reach the bottom
  const word = $('.ftr__word');
  if (word) gsap.from(word.children, { yPercent: 100, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  // videos marked data-autoplay play only while visible
  const io = new IntersectionObserver((es) => es.forEach((en) => { const v = en.target; if (en.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.15 });
  $$('video[data-autoplay]').forEach((v) => io.observe(v));
}
export const observeVideos = (root = document) => {
  const io = new IntersectionObserver((es) => es.forEach((en) => { const v = en.target; if (en.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.15 });
  $$('video[data-autoplay]', root).forEach((v) => io.observe(v));
};

// ─── the talk ball (top-right 3D pool ball)
function initTalk() {
  const el = $('.talk'); if (!el) return;
  const canvas = $('.talk__ball', el);
  import('../gl/ball.js').then(({ createBall }) => {
    const b = createBall(canvas, { ring: $('.talk__ring', el), getScrollVelocity: () => (lenis ? lenis.velocity : 0), reduceMotion });
    if (!b) el.classList.add('is-fallback');
  }).catch(() => el.classList.add('is-fallback'));
}

// ─── boot
/**
 * @param {object} o
 * @param {string} o.page            nav id to mark active
 * @param {Promise[]} [o.tasks]      things the preloader waits for
 * @param {(fromPreloader:boolean)=>void} [o.onEnter]  called when the page is revealed
 */
export async function boot({ page, tasks = [], onEnter } = {}) {
  initScroll();
  initLinks();
  initHeader(page);
  initCursor();
  initModal();
  initMisc();
  initTalk();
  await document.fonts.ready.catch(() => {});
  initReveals();
  const first = html.classList.contains('is-first');
  if (html.classList.contains('is-tx') && !first) {
    $('#pl')?.remove();
    revealFromTransition();
    setTimeout(() => onEnter?.(false), 250);
  } else if (first) {
    html.classList.remove('is-tx');
    const shown = await runPreloader([document.fonts.ready, ...tasks]);
    onEnter?.(shown);
  } else {
    $('#pl')?.remove();
    onEnter?.(false);
  }
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
