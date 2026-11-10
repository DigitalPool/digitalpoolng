import { boot, gsap, $, $$, openModal } from '../core/app.js';
import { hoverVideos } from '../core/hover.js';
import { motion, reel } from '../data.js';

$('#mCount').textContent = String(motion.length).padStart(2, '0');
$('#mgrid').innerHTML = motion.map((m, i) => `
  <button class="mcard" type="button" data-m="${i}" data-cursor="Play">
    <img src="${m.poster}" alt="${m.title}" loading="${i < 4 ? 'eager' : 'lazy'}" />
    <video muted loop playsinline preload="none" src="${m.loop}"></video>
    <span class="mcard__meta"><span><b>${m.title}</b><span>${m.line}</span></span><span class="mono">${String(i + 1).padStart(2, '0')}</span></span>
  </button>`).join('');

hoverVideos($$('.mcard'));
$$('.mcard').forEach((c) => gsap.from(c, { y: 80, autoAlpha: 0, scale: 0.96, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 96%', once: true } }));
$('#mgrid').addEventListener('click', (e) => {
  const c = e.target.closest('[data-m]'); if (!c) return;
  openModal(motion.map((m) => ({ type: 'video', src: m.full, poster: m.poster, caption: `${m.title} · ${m.line}` })), +c.dataset.m);
});
$('#playReel').addEventListener('click', () => openModal([{ type: 'video', src: reel.src, poster: reel.poster, caption: 'DigitalPool showreel' }]));

boot({ page: 'motion' });
