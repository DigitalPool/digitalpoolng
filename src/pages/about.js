import { boot, gsap, $, $$ } from '../core/app.js';
import { team } from '../data.js';
import { createInk } from '../gl/ink.js';

$('#team').innerHTML = team.map((t) => `
  <div class="member">
    <div class="member__photo"><img src="${t.photo}" alt="${t.name}" loading="lazy" /></div>
    <h3 class="member__name">${t.name}</h3>
    <p class="member__role mono">${t.role}</p>
  </div>`).join('');

// team photos tilt toward the cursor
$$('.member__photo').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 10, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 10, transformPerspective: 800, duration: 0.8, ease: 'power3.out' });
  });
  el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)' }));
});

const ink = createInk($('#ink'));
gsap.to('.ink-hero__inner', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.ink-hero', start: '35% top', end: 'bottom top', scrub: true } });

boot({
  page: 'about',
  onEnter() {
    if (!ink) return;
    ink.drip(0.8, 0.62, 2.2);
    setTimeout(() => ink.drip(0.88, 0.3, 1.4), 500);
  },
});
