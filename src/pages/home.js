import { boot, gsap, ScrollTrigger, $, $$, isTouch, openModal, setCursor, reduceMotion } from '../core/app.js';
import { hoverPreview, hoverVideos } from '../core/hover.js';
import { projects, services, graphics, motion, team, reel } from '../data.js';
import { createPool } from '../gl/pool.js';

const pad = (n) => String(n).padStart(2, '0');

// ── render content
$('#workList').innerHTML = projects.map((p, i) => `
  <a class="wl__row" href="/case?p=${p.slug}" data-preview="${p.preview}" data-cover="${p.cover}" data-cursor="View">
    <span class="wl__thumb"><img src="${p.cover}" alt="" loading="lazy" /></span>
    <span class="wl__idx mono">${pad(i + 1)}</span>
    <span class="wl__title">${p.title}</span>
    <span class="wl__kind">${p.kind}<br /><span class="mono" style="color:var(--muted)">${p.client}</span></span>
    <span class="wl__go" aria-hidden="true">→</span>
  </a>`).join('');

$('#services').innerHTML = services.map((s, i) => `
  <div class="svc__item">
    <span class="svc__num">${pad(i + 1)}</span>
    <h3 class="svc__title">${s.title}</h3>
    <div class="svc__body"><p>${s.text}</p><div class="tags">${s.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div></div>
  </div>`).join('');

const railPick = [5, 11, 36, 51, 1, 54, 41, 6, 60, 58, 47, 66, 17, 62, 28, 70];
$('#railTrack').innerHTML = railPick.map((i) => {
  const g = graphics[i - 1];
  return `<button class="rail__card" type="button" data-g="${i - 1}" data-cursor="Open" style="aspect-ratio:${g.w}/${g.h}"><img src="${g.src}" alt="Graphic design by DigitalPool" loading="lazy" width="${g.w}" height="${g.h}" /></button>`;
}).join('');

$('#motionStrip').innerHTML = motion.slice(0, 4).map((m, i) => `
  <button class="mcard" type="button" data-m="${i}" data-cursor="Play">
    <img src="${m.poster}" alt="" loading="lazy" />
    <video muted loop playsinline preload="none" src="${m.loop}"></video>
    <span class="mcard__meta"><span><b>${m.title}</b><span>${m.line}</span></span></span>
  </button>`).join('');

$('#faces').innerHTML = team.map((t) => `<img src="${t.photo}" alt="${t.name}, ${t.role}" loading="lazy" />`).join('');

// ── interactions
hoverPreview($('#workList'));
hoverVideos($$('.mcard'));
$('#railTrack').addEventListener('click', (e) => {
  const c = e.target.closest('[data-g]'); if (!c) return;
  openModal(railPick.map((i) => ({ type: 'image', src: graphics[i - 1].src })), railPick.indexOf(+c.dataset.g + 1));
});
$('#motionStrip').addEventListener('click', (e) => {
  const c = e.target.closest('[data-m]'); if (!c) return;
  openModal(motion.map((m) => ({ type: 'video', src: m.full, poster: m.poster, muted: true, loop: true, caption: `${m.title} · ${m.line}` })), +c.dataset.m);
});
const playReel = () => openModal([{ type: 'video', src: reel.src, poster: reel.poster, caption: 'DigitalPool showreel' }]);
$('#reelPlay').addEventListener('click', playReel);
$('#reelFrame').addEventListener('click', (e) => { if (!e.target.closest('#reelPlay')) playReel(); });

// ── the pool
const canvas = $('#pool');
const pool = createPool(canvas, {
  onHover: (s) => setCursor(s || '', ''),
});
canvas.addEventListener('pointerenter', () => setCursor('water'));
const firstFrame = new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const posterReady = new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = reel.poster; });

// hero scroll: camera lifts to look down into the pool, title drifts away
ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
  onUpdate: (st) => pool?.setScroll(st.progress),
});
gsap.to('.hero__inner', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

// reel grows from a card into full screen
const reelVid = $('#reelVideo');
gsap.timeline({ scrollTrigger: { trigger: '#reel', start: 'top top', end: 'bottom bottom', scrub: true } })
  .fromTo('#reelFrame', { clipPath: innerWidth < 860 ? 'inset(30% 6% 30% 6% round 22px)' : 'inset(24% 30% 24% 30% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 0.7 })
  .fromTo('.reel__labels span:first-child', { xPercent: 0 }, { xPercent: -140, ease: 'power2.in', duration: 0.6 }, 0)
  .fromTo('.reel__labels span:last-child', { xPercent: 0 }, { xPercent: 140, ease: 'power2.in', duration: 0.6 }, 0)
  .to({}, { duration: 0.3 });
new IntersectionObserver(([e]) => (e.isIntersecting ? reelVid.play().catch(() => {}) : reelVid.pause()), { threshold: 0.05 }).observe($('#reel'));

// horizontal graphics rail driven by vertical scroll
const track = $('#railTrack');
gsap.to(track, {
  x: () => -(track.scrollWidth - innerWidth),
  ease: 'none',
  scrollTrigger: { trigger: '#rail', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
});

// ── intro
gsap.set('[data-hero-fade]', { autoAlpha: 0, y: 20 });
boot({
  page: 'home',
  tasks: [firstFrame, posterReady],
  onEnter(fromPreloader) {
    const title = $('#heroTitle');
    title._entered = true;
    const lines = title._lines || [];
    gsap.to(lines, { yPercent: 0, duration: 1.6, ease: 'expo.out', stagger: 0.12, delay: fromPreloader ? 0.1 : 0.2 });
    gsap.to('[data-hero-fade]', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.6 });
    if (!reduceMotion) setTimeout(() => pool?.splash(1.4, 0, 1.4), fromPreloader ? 0 : 300);
  },
});
