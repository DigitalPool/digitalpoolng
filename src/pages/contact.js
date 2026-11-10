import { boot, $, $$, setCursor, toast, reduceMotion } from '../core/app.js';
import { site } from '../data.js';
import { createPool } from '../gl/pool.js';

if (site.fiverr) { const f = $('#fiverr'); f.hidden = false; f.querySelector('a').href = site.fiverr; }

const canvas = $('#pool');
const pool = createPool(canvas, { preset: 'contact', onHover: (s) => setCursor(s || '', '') });
canvas.addEventListener('pointerenter', () => setCursor('water'));
// the whole hero is clickable water, even over the title
$('.contact-hero').addEventListener('pointerdown', (e) => {
  if (e.target === canvas || e.target.closest('a, button')) return;
  pool?.splashScreen(e.clientX, e.clientY, 1);
});

$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim(), email = f.email.value.trim();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
    toast('Add your name and a valid email');
    (!name ? f.name : f.email).focus();
    return;
  }
  const needs = $$('input[name="need"]:checked', f).map((i) => i.value).join(', ') || 'Not specified';
  const budget = $('input[name="budget"]:checked', f)?.value || 'Not specified';
  const body = `Hi DigitalPool,\n\nName: ${name}\nEmail: ${email}\nNeeds: ${needs}\nBudget: ${budget}\n\n${f.message.value.trim()}\n`;
  location.href = `mailto:${site.email}?subject=${encodeURIComponent(`New project: ${name}`)}&body=${encodeURIComponent(body)}`;
  toast('Opening your email app…');
});

boot({
  page: 'contact',
  onEnter() { if (!reduceMotion) setTimeout(() => pool?.splash(0.2, 0, 1.3), 200); },
});
