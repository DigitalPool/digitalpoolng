// Cloudflare Worker: serves the static site from ./dist and handles POST /api/brief,
// which validates and sanitises the contact form, then emails it (with attachments)
// through Resend (https://resend.com).
//
// Secrets / variables (Cloudflare dashboard > your Worker > Settings > Variables and Secrets):
//   RESEND_API_KEY  (secret, required)  API key from resend.com
//   BRIEF_TO        (optional)          where briefs go. Default: hello@digitalpoolng.com
//   BRIEF_FROM      (optional)          sender on a domain verified in Resend.
//                                       Default: DigitalPool website <website@digitalpoolng.com>

export const LIMITS = {
  name: 100,
  email: 254,
  message: 5000,
  files: 5,
  fileBytes: 10 * 1024 * 1024, // 10 MB each
  totalBytes: 20 * 1024 * 1024, // 20 MB together
  minFillMs: 3000, // humans take longer than this to fill the form
};
export const NEEDS = ['3D website', 'Web app / SaaS', 'Mobile app', 'Shopify store', 'UI/UX design', 'Branding & graphics', 'Motion'];
export const BUDGETS = ['Under $2k', '$2k–$5k', '$5k–$15k', '$15k+', 'Not sure yet'];
const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?digitalpoolng\.com$/, /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/brief') {
      if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'POST' });
      try {
        return await handleBrief(request, env, url);
      } catch (err) {
        console.error('brief failed', err);
        return json({ ok: false, error: 'Something went wrong on our side. Please email us directly.' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

// ─── sanitising helpers
// remove control characters (keeping newlines/tabs only where text may be multi-line)
// built from a string so bundlers can't turn the \u2028 escape into a literal line break inside a regex
const CTRL_ALL = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202E\\u2060-\\u206F\\uFEFF]', 'g');
// built from a string so bundlers can't turn the \u2028 escape into a literal line break inside a regex
const CTRL_KEEP_NL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u200B-\\u200F\\u2028-\\u202E\\u2060-\\u206F\\uFEFF]', 'g');

export function cleanLine(v, max) {
  return String(v ?? '').normalize('NFC').replace(CTRL_ALL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
export function cleanText(v, max) {
  return String(v ?? '').normalize('NFC').replace(/\r\n?/g, '\n').replace(CTRL_KEEP_NL, '').replace(/\n{4,}/g, '\n\n\n').trim().slice(0, max);
}
export function cleanFilename(n) {
  const base = String(n || 'file').normalize('NFC').replace(CTRL_ALL, '').split(/[\\/]/).pop();
  const safe = base.replace(/[^\p{L}\p{N} ._()\-]/gu, '_').replace(/^\.+/, '').replace(/\s+/g, ' ').trim();
  return (safe || 'file').slice(-120);
}
export const isEmail = (e) => e.length <= LIMITS.email && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/.test(e);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
function toBase64(buf) {
  const bytes = new Uint8Array(buf); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

// ─── the handler
async function handleBrief(request, env, url) {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin && !ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    return json({ ok: false, error: 'Forbidden.' }, 403);
  }
  const type = request.headers.get('content-type') || '';
  if (!type.startsWith('multipart/form-data')) return json({ ok: false, error: 'Unsupported form encoding.' }, 415);
  const len = Number(request.headers.get('content-length') || 0);
  if (len > LIMITS.totalBytes + 1024 * 1024) return json({ ok: false, error: 'Attachments are too large (20 MB total).' }, 413);

  const form = await request.formData();

  // bots: the hidden field must be empty and the form must not be filled instantly
  const trap = form.get('company_website');
  const started = Number(form.get('t'));
  if ((typeof trap === 'string' && trap.trim()) || !started || Date.now() - started < LIMITS.minFillMs) {
    return json({ ok: true }); // pretend success so bots don't retry
  }

  const name = cleanLine(form.get('name'), LIMITS.name);
  const email = cleanLine(form.get('email'), LIMITS.email).toLowerCase();
  const needs = [...new Set(form.getAll('need').map((v) => cleanLine(v, 40)))].filter((v) => NEEDS.includes(v));
  const budgetRaw = cleanLine(form.get('budget'), 40);
  const budget = BUDGETS.includes(budgetRaw) ? budgetRaw : '';
  const message = cleanText(form.get('message'), LIMITS.message);

  const errors = {};
  if (!name) errors.name = 'Please add your name.';
  if (!isEmail(email)) errors.email = 'Please add a valid email address.';
  if (Object.keys(errors).length) return json({ ok: false, error: 'Please check the highlighted fields.', fields: errors }, 400);

  const files = form.getAll('files').filter((f) => typeof f === 'object' && f && typeof f.arrayBuffer === 'function' && f.size > 0);
  if (files.length > LIMITS.files) return json({ ok: false, error: `Attach up to ${LIMITS.files} files.` }, 400);
  let total = 0;
  for (const f of files) {
    if (f.size > LIMITS.fileBytes) return json({ ok: false, error: `“${cleanFilename(f.name)}” is over 10 MB.` }, 413);
    total += f.size;
  }
  if (total > LIMITS.totalBytes) return json({ ok: false, error: 'Attachments are too large (20 MB total).' }, 413);

  if (!env.RESEND_API_KEY) return json({ ok: false, error: 'not_configured' }, 503);

  const attachments = await Promise.all(files.map(async (f) => ({ filename: cleanFilename(f.name), content: toBase64(await f.arrayBuffer()) })));
  const rows = [['Name', name], ['Email', email], ['Needs', needs.join(', ') || 'Not specified'], ['Budget', budget || 'Not specified'], ['Attachments', attachments.map((a) => a.filename).join(', ') || 'None']];
  const text = `New brief from digitalpoolng.com\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${message || '(no message)'}\n`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0d0d0f;line-height:1.5">
    <h2 style="margin:0 0 16px;color:#e8323d">New brief from digitalpoolng.com</h2>
    <table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#7a7a80;vertical-align:top">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
    <p style="margin-top:20px;white-space:pre-wrap">${esc(message || '(no message)')}</p></div>`;

  const res = await fetch(env.RESEND_API_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.BRIEF_FROM || 'DigitalPool website <website@digitalpoolng.com>',
      to: [env.BRIEF_TO || 'hello@digitalpoolng.com'],
      reply_to: email,
      subject: `New brief: ${name}`.slice(0, 150),
      text,
      html,
      attachments,
    }),
  });
  if (!res.ok) {
    console.error('resend error', res.status, (await res.text()).slice(0, 500));
    return json({ ok: false, error: 'We could not send your brief just now. Please email us directly.' }, 502);
  }
  return json({ ok: true });
}
