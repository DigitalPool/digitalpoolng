import { boot, $, $$, setCursor, toast, reduceMotion, gsap } from '../core/app.js';
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

// ─── limits (the server enforces the same ones; these just give instant feedback)
const LIMITS = { name: 100, email: 254, message: 5000, files: 5, fileBytes: 10 * 1024 * 1024, totalBytes: 20 * 1024 * 1024 };
// built from a string so bundlers can't turn the \u2028 escape into a literal line break inside a regex
const CTRL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202E\\u2060-\\u206F\\uFEFF]', 'g');
const cleanLine = (v, max) => String(v || '').normalize('NFC').replace(CTRL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanText = (v, max) => String(v || '').normalize('NFC').replace(/\r\n?/g, '\n').replace(CTRL, '').trim().slice(0, max);
const isEmail = (e) => e.length <= LIMITS.email && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/.test(e);
const fmt = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

const form = $('#form');
const started = Date.now();
const status = $('#status');
const setStatus = (msg, err = false) => { status.textContent = msg; status.classList.toggle('is-error', err); };

// ─── message counter
const msg = $('#fMsg'), count = $('#msgCount');
msg.addEventListener('input', () => { count.textContent = `${msg.value.length} / ${LIMITS.message}`; });

// ─── attachments
let files = [];
const list = $('#files'), input = $('#fFiles'), drop = $('#drop');
function renderFiles() {
  list.innerHTML = '';
  files.forEach((f, i) => {
    const li = document.createElement('li');
    const n = document.createElement('span'); n.textContent = f.name; // textContent: file names are never parsed as HTML
    const s = document.createElement('small'); s.textContent = fmt(f.size);
    const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', `Remove ${f.name}`);
    x.addEventListener('click', () => { files.splice(i, 1); renderFiles(); });
    li.append(n, s, x); list.append(li);
  });
}
function addFiles(list) {
  for (const f of list) {
    if (files.length >= LIMITS.files) { toast(`Up to ${LIMITS.files} files`); break; }
    if (!f.size) continue;
    if (f.size > LIMITS.fileBytes) { toast(`${f.name} is over 10 MB`); continue; }
    if (files.reduce((a, b) => a + b.size, 0) + f.size > LIMITS.totalBytes) { toast('Attachments are limited to 20 MB total'); break; }
    if (files.some((g) => g.name === f.name && g.size === f.size)) continue;
    files.push(f);
  }
  renderFiles();
}
input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

// ─── validation
function fieldError(id, text) {
  const field = $(`#${id}`).closest('.field');
  field.classList.toggle('is-invalid', !!text);
  $(`#${id === 'fName' ? 'eName' : 'eEmail'}`).textContent = text || '';
}
const DEFAULT_STATUS = status.textContent;
['fName', 'fEmail'].forEach((id) => $(`#${id}`).addEventListener('input', () => {
  fieldError(id, '');
  if (status.classList.contains('is-error') && !$('.field.is-invalid', form)) setStatus(DEFAULT_STATUS);
}));

function collect() {
  return {
    name: cleanLine(form.name.value, LIMITS.name),
    email: cleanLine(form.email.value, LIMITS.email).toLowerCase(),
    needs: $$('input[name="need"]:checked', form).map((i) => i.value),
    budget: $('input[name="budget"]:checked', form)?.value || '',
    message: cleanText(form.message.value, LIMITS.message),
  };
}

function mailtoFallback(d) {
  const body = `Hi DigitalPool,\n\nName: ${d.name}\nEmail: ${d.email}\nNeeds: ${d.needs.join(', ') || 'Not specified'}\nBudget: ${d.budget || 'Not specified'}\n\n${d.message}\n`;
  return `mailto:${site.email}?subject=${encodeURIComponent(`New project: ${d.name}`)}&body=${encodeURIComponent(body)}`;
}

// XHR (not fetch) so we can show upload progress for attachments
function send(fd, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/brief');
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => { let data = {}; try { data = JSON.parse(xhr.responseText); } catch {} resolve({ status: xhr.status, data }); };
    xhr.onerror = xhr.ontimeout = () => resolve({ status: 0, data: {} });
    xhr.send(fd);
  });
}

const btn = $('#send'), label = $('.send__label', btn), bar = $('.send__bar', btn);
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btn.disabled) return;
  const d = collect();
  let bad = false;
  if (!d.name) { fieldError('fName', 'Please add your name.'); bad = true; }
  if (!isEmail(d.email)) { fieldError('fEmail', 'Please add a valid email address.'); bad = true; }
  if (bad) { setStatus('Please check the highlighted fields.', true); form.querySelector('.is-invalid input')?.focus(); return; }

  const fd = new FormData();
  fd.append('name', d.name); fd.append('email', d.email); fd.append('message', d.message);
  d.needs.forEach((n) => fd.append('need', n));
  if (d.budget) fd.append('budget', d.budget);
  files.forEach((f) => fd.append('files', f, f.name));
  fd.append('company_website', form.company_website.value);
  fd.append('t', String(started));

  btn.disabled = true; label.textContent = files.length ? 'Uploading 0%' : 'Sending…'; setStatus('Sending your brief…');
  const { status: code, data } = await send(fd, (p) => {
    bar.style.width = `${Math.round(p * 100)}%`;
    if (files.length) label.textContent = p < 1 ? `Uploading ${Math.round(p * 100)}%` : 'Sending…';
  });
  btn.disabled = false; bar.style.width = '0'; label.textContent = 'Send the brief';

  if (code === 200 && data.ok) return done(d.name);
  if (code === 400 && data.fields) {
    Object.entries(data.fields).forEach(([k, v]) => fieldError(k === 'name' ? 'fName' : 'fEmail', v));
    return setStatus(data.error, true);
  }
  if (code === 413 || (code === 400 && data.error)) return setStatus(data.error, true);
  // not configured yet, offline, or server trouble: offer email instead of losing the brief
  status.classList.add('is-error');
  status.textContent = files.length
    ? "We couldn't send it automatically. Please email us, and attach your files to that email: "
    : "We couldn't send it automatically. Please email us instead: ";
  const a = document.createElement('a'); a.href = mailtoFallback(d); a.textContent = site.email; a.style.borderBottom = '1px solid currentColor';
  status.append(a);
});

function done(name) {
  const box = document.createElement('div');
  box.className = 'form-done';
  box.setAttribute('role', 'status');
  const b = document.createElement('b'); b.innerHTML = 'Brief <em>received</em>';
  const p = document.createElement('p'); p.className = 'lead';
  p.textContent = `Thanks, ${name.split(' ')[0]}. It's in our inbox, and we'll reply within one working day.`;
  const again = document.createElement('a'); again.className = 'pill pill--ghost'; again.href = '/'; again.innerHTML = '<span>Back to home</span>';
  box.append(b, p, again);
  gsap.to(form, { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in', onComplete() {
    form.replaceWith(box);
    gsap.from(box, { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
  } });
  toast('Brief sent ✓');
  if (!reduceMotion) pool?.splash(0.2, 0, 1.6);
}

boot({
  page: 'contact',
  onEnter() { if (!reduceMotion) setTimeout(() => pool?.splash(0.2, 0, 1.3), 200); },
});
