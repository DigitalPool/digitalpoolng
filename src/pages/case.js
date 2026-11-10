import { boot, gsap, $, $$, openModal, initReveals, SplitText } from '../core/app.js';
import { projects } from '../data.js';

const slug = new URLSearchParams(location.search).get('p');
const i = Math.max(0, projects.findIndex((p) => p.slug === slug));
if (!projects.some((p) => p.slug === slug)) history.replaceState(null, '', `/case?p=${projects[0].slug}`);
const p = projects[i];
const next = projects[(i + 1) % projects.length];
const pad = (n) => String(n).padStart(2, '0');

document.title = `${p.title} · ${p.kind} · DigitalPool`;
document.querySelector('meta[name="description"]').content = p.line;
document.documentElement.style.setProperty('--accent', p.color);

$('#cIndex').textContent = `${pad(i + 1)} / ${pad(projects.length)}`;
$('#cKind').textContent = p.kind;
$('#cTitle').textContent = p.title;
$('#cLine').textContent = p.line;
$('#cIntro').textContent = p.intro;
$('#cChallenge').textContent = p.challenge;
$('#cApproach').textContent = p.approach;
$('#cHl').innerHTML = p.highlights.map((h) => `<li>${h}</li>`).join('');
const host = new URL(p.url).hostname.replace('www.', '');
const isApp = p.url.includes('apps.apple.com');
$('#cMeta').innerHTML = `
  <div><h4 class="mono">Client</h4><p>${p.client}</p></div>
  <div><h4 class="mono">Services</h4><p>${p.services.join('<br />')}</p></div>
  <div><h4 class="mono">Stack</h4><p>${p.stack.join(', ')}</p></div>
  <div><h4 class="mono">${isApp ? 'Download' : 'Live'}</h4><p><a href="${p.url}" target="_blank" rel="noopener" style="border-bottom:1px solid var(--red)">${isApp ? 'App Store' : host} ↗</a></p></div>`;
$('#cVisit').innerHTML = `<a class="pill pill--red pill--lg" href="${p.url}" target="_blank" rel="noopener" data-magnetic><span>${isApp ? 'Get it on the App Store' : 'Visit the live site'}</span> <span class="arrow">→</span></a>`;
$('#cCover').innerHTML = `<video src="${p.preview}" poster="${p.cover}" muted loop playsinline autoplay data-autoplay></video>`;

// gallery
const g = [];
if (p.screens) {
  g.push(`<div class="phones-rail" style="overflow:hidden;padding-block:20px"><div class="phones" id="phones">${p.screens.map((s, k) => `<button type="button" class="phone" data-shot="${k}" data-cursor="Zoom"><img src="${s}" alt="${p.title} screen ${k + 1}" loading="lazy" /></button>`).join('')}</div></div>`);
  g.push(`<div class="case-gallery" style="margin-top:18px">${p.extra.map((s, k) => `<button type="button" class="media ${k ? 'is-half' : 'is-half'}" style="aspect-ratio:auto" data-extra="${k}" data-unveil><img src="${s}" alt="" loading="lazy" style="height:auto" /></button>`).join('')}</div>`);
} else {
  const shots = p.shots;
  const items = [];
  // rhythm: full, [phone + note], half/half, full, half/half…
  const rest = shots.slice(1);
  const shot = (s, k, cls = '') => `<button type="button" class="media ${cls}" data-shot="${k}" data-cursor="Zoom" data-unveil><img src="${s}" alt="${p.title} screenshot ${k + 1}" loading="lazy" /></button>`;
  if (shots[0]) items.push(shot(shots[0], 0));
  if (p.mobile) items.push(`<div class="media is-phone" data-reveal><div class="phone"><img src="${p.mobile}" alt="${p.title} on mobile" loading="lazy" /></div></div><div class="media is-wide" style="background:transparent;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:clamp(10px,4vw,60px)" data-reveal><span class="eyebrow">Built for every screen</span><p class="h3">Designed mobile-first, tuned for touch and fast on real networks.</p></div>`);
  let k = 1;
  while (k <= rest.length) {
    const left = rest.length - k + 1;
    if (left >= 2) { items.push(shot(shots[k], k, 'is-half'), shot(shots[k + 1], k + 1, 'is-half')); k += 2; }
    if (k <= rest.length) { items.push(shot(shots[k], k)); k += 1; }
  }
  g.push(`<div class="case-gallery">${items.join('')}</div>`);
}
$('#cGallery').innerHTML = g.join('');
$('#cGallery').classList.add('section');
$('#cGallery').style.paddingTop = '0';

const all = p.screens || p.shots;
$('#cGallery').addEventListener('click', (e) => {
  const s = e.target.closest('[data-shot]');
  if (s) return openModal(all.map((src) => ({ type: 'image', src })), +s.dataset.shot);
  const x = e.target.closest('[data-extra]');
  if (x) openModal(p.extra.map((src) => ({ type: 'image', src })), +x.dataset.extra);
});

// next project
$('#cNext').href = `/case?p=${next.slug}`;
$('#cNextTitle').textContent = next.title;
$('#cNextImg').src = next.cover;

// hero title: letters rise in, then breathe in width as you move

if (p.screens) {
  const rail = $('#phones');
  gsap.fromTo(rail, { x: 0 }, { x: () => -(rail.scrollWidth - innerWidth) - 40, ease: 'none', scrollTrigger: { trigger: rail, start: 'top 85%', end: 'bottom 10%', scrub: 0.6, invalidateOnRefresh: true } });
}

boot({
  page: 'work',
  onEnter() {
    const t = $('#cTitle');
    const split = SplitText.create(t, { type: 'chars, words', charsClass: 'ch' });
    t.style.overflow = 'hidden';
    gsap.set(t, { visibility: 'visible' });
    gsap.from(split.chars, { yPercent: 110, duration: 1.3, stagger: 0.025, ease: 'expo.out' });
  },
});
