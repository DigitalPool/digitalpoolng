import { boot, gsap, ScrollTrigger, $, $$ } from '../core/app.js';
import { hoverPreview, hoverVideos } from '../core/hover.js';
import { projects, filters } from '../data.js';

const pad = (n) => String(n).padStart(2, '0');
$('#count').textContent = pad(projects.length);

$('#filters').innerHTML = filters.map((f, i) => {
  const n = f.id === 'all' ? projects.length : projects.filter((p) => p.filter === f.id).length;
  return n ? `<button class="chip${i ? '' : ' is-active'}" type="button" role="tab" aria-selected="${!i}" data-f="${f.id}">${f.label}<sup>${n}</sup></button>` : '';
}).join('');

$('#grid').innerHTML = projects.map((p, i) => `
  <a class="card" href="/case?p=${p.slug}" data-filter="${p.filter}" data-cursor="View">
    <div class="card__media" data-tilt>
      <img src="${p.cover}" alt="${p.title}" loading="${i < 2 ? 'eager' : 'lazy'}" />
      <video muted loop playsinline preload="none" src="${p.preview}"></video>
    </div>
    <div class="card__info">
      <div><h2 class="card__title">${p.title}</h2><p class="card__kind">${p.kind} · ${p.client}</p></div>
      <span class="card__num mono">${pad(i + 1)}</span>
    </div>
  </a>`).join('');

$('#list').innerHTML = projects.map((p, i) => `
  <a class="wl__row" href="/case?p=${p.slug}" data-filter="${p.filter}" data-preview="${p.preview}" data-cover="${p.cover}" data-cursor="View">
    <span class="wl__thumb"><img src="${p.cover}" alt="" loading="lazy" /></span>
    <span class="wl__idx mono">${pad(i + 1)}</span>
    <span class="wl__title">${p.title}</span>
    <span class="wl__kind">${p.kind}<br /><span class="mono" style="color:var(--muted)">${p.client}</span></span>
    <span class="wl__go" aria-hidden="true">→</span>
  </a>`).join('');

hoverVideos($$('.card'));
hoverPreview($('#list'));

// cards drift at different speeds and tilt toward the cursor
$$('.card').forEach((card, i) => {
  gsap.from(card, { y: 120, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 95%', once: true } });
  const media = card.querySelector('[data-tilt]');
  card.addEventListener('pointermove', (e) => {
    const r = media.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(media, { rotateY: x * 6, rotateX: -y * 6, transformPerspective: 900, duration: 0.8, ease: 'power3.out' });
  });
  card.addEventListener('pointerleave', () => gsap.to(media, { rotateY: 0, rotateX: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)' }));
});

function applyFilter(id) {
  $$('#filters .chip').forEach((c) => { const on = c.dataset.f === id; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', on); });
  const items = $$('.card, #list .wl__row');
  gsap.to(items, {
    autoAlpha: 0, y: 30, duration: 0.3, ease: 'power2.in', onComplete: () => {
      items.forEach((el) => el.classList.toggle('is-out', id !== 'all' && el.dataset.filter !== id));
      items.forEach((el) => { el.style.display = el.classList.contains('is-out') ? 'none' : ''; });
      ScrollTrigger.refresh();
      gsap.fromTo(items.filter((el) => !el.classList.contains('is-out')), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' });
    },
  });
}
$('#filters').addEventListener('click', (e) => { const c = e.target.closest('[data-f]'); if (c) applyFilter(c.dataset.f); });

$$('[data-view]').forEach((b) => b.addEventListener('click', () => {
  const list = b.dataset.view === 'list';
  $$('[data-view]').forEach((x) => x.classList.toggle('is-active', x === b));
  $('#grid').hidden = list; $('#list').hidden = !list;
  ScrollTrigger.refresh();
  gsap.fromTo(list ? '#list .wl__row' : '.card', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.9, ease: 'expo.out' });
}));

boot({ page: 'work' });
