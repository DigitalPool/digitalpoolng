// Red ink dropped into still water: a stable-fluids simulation (advection, curl,
// vorticity, pressure projection) rendered as ink on a white page.
import * as THREE from 'three';

const VS = /* glsl */ `
varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
uniform vec2 texel;
void main(){
  vUv = uv; vL = uv - vec2(texel.x, 0.0); vR = uv + vec2(texel.x, 0.0);
  vT = uv + vec2(0.0, texel.y); vB = uv - vec2(0.0, texel.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
const H = 'precision highp float; varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;';

const FS = {
  splat: `${H} uniform sampler2D tex; uniform float aspect; uniform vec3 color; uniform vec2 point; uniform float radius;
    void main(){ vec2 p = vUv - point; p.x *= aspect; vec3 s = exp(-dot(p,p)/radius) * color; gl_FragColor = vec4(texture2D(tex, vUv).xyz + s, 1.0); }`,
  advect: `${H} uniform sampler2D vel; uniform sampler2D src; uniform vec2 texel; uniform float dt; uniform float dissipation;
    void main(){ vec2 c = vUv - dt * texture2D(vel, vUv).xy * texel; gl_FragColor = texture2D(src, c) / (1.0 + dissipation * dt); }`,
  divergence: `${H} uniform sampler2D vel;
    void main(){ float L = texture2D(vel, vL).x, R = texture2D(vel, vR).x, T = texture2D(vel, vT).y, B = texture2D(vel, vB).y;
      vec2 C = texture2D(vel, vUv).xy; if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0); }`,
  curl: `${H} uniform sampler2D vel;
    void main(){ float L = texture2D(vel, vL).y, R = texture2D(vel, vR).y, T = texture2D(vel, vT).x, B = texture2D(vel, vB).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0); }`,
  vorticity: `${H} uniform sampler2D vel; uniform sampler2D curl; uniform float strength; uniform float dt;
    void main(){ float L = texture2D(curl, vL).x, R = texture2D(curl, vR).x, T = texture2D(curl, vT).x, B = texture2D(curl, vB).x, C = texture2D(curl, vUv).x;
      vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L)); f /= length(f) + 0.0001; f *= strength * C; f.y *= -1.0;
      vec2 v = texture2D(vel, vUv).xy + f * dt; gl_FragColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0); }`,
  clear: `${H} uniform sampler2D tex; uniform float value; void main(){ gl_FragColor = value * texture2D(tex, vUv); }`,
  pressure: `${H} uniform sampler2D pressure; uniform sampler2D divergence;
    void main(){ float L = texture2D(pressure, vL).x, R = texture2D(pressure, vR).x, T = texture2D(pressure, vT).x, B = texture2D(pressure, vB).x;
      float d = texture2D(divergence, vUv).x; gl_FragColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0); }`,
  gradient: `${H} uniform sampler2D pressure; uniform sampler2D vel;
    void main(){ float L = texture2D(pressure, vL).x, R = texture2D(pressure, vR).x, T = texture2D(pressure, vT).x, B = texture2D(pressure, vB).x;
      vec2 v = texture2D(vel, vUv).xy - vec2(R - L, T - B); gl_FragColor = vec4(v, 0.0, 1.0); }`,
  display: `${H} uniform sampler2D dye; uniform vec3 bg; uniform vec3 ink; uniform vec3 deep; uniform vec2 texel;
    void main(){
      float d = texture2D(dye, vUv).r;
      float dl = texture2D(dye, vL).r, dr = texture2D(dye, vR).r, dt = texture2D(dye, vT).r, db = texture2D(dye, vB).r;
      vec3 n = normalize(vec3(dl - dr, db - dt, 0.35));
      float light = dot(n, normalize(vec3(-0.4, 0.6, 0.7)));
      float a = smoothstep(0.0, 0.9, d);
      vec3 c = mix(ink, deep, smoothstep(0.8, 2.4, d));
      vec3 col = mix(bg, c, a);
      col += (light - 0.62) * 0.25 * a;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
};

export function createInk(canvas, { bg = '#fbfbf9', ink = '#e8323d', deep = '#7d0a14', auto = true } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false }); } catch { return null; }
  const touch = matchMedia('(hover: none)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.autoClear = false;
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); scene.add(quad);

  const SIM = touch ? 96 : 128, DYE = touch ? 384 : 640;
  const mk = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const dbl = (w, h) => { const o = { a: mk(w, h), b: mk(w, h), w, h }; o.swap = () => { [o.a, o.b] = [o.b, o.a]; }; return o; };
  let vel, dye, pressure, div, curl;
  function alloc() {
    const ar = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const sw = ar >= 1 ? Math.round(SIM * ar) : SIM, sh = ar >= 1 ? SIM : Math.round(SIM / ar);
    const dw = ar >= 1 ? Math.round(DYE * ar) : DYE, dh = ar >= 1 ? DYE : Math.round(DYE / ar);
    [vel, dye, pressure].forEach((o) => o && (o.a.dispose(), o.b.dispose()));
    vel = dbl(sw, sh); pressure = dbl(sw, sh); dye = dbl(dw, dh);
    div?.dispose(); curl?.dispose(); div = mk(sw, sh); curl = mk(sw, sh);
  }
  const mat = (fs, u) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: { texel: { value: new THREE.Vector2() }, ...u }, depthTest: false, depthWrite: false });
  const P = {
    splat: mat(FS.splat, { tex: { value: null }, aspect: { value: 1 }, color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() }, radius: { value: 0.002 } }),
    advect: mat(FS.advect, { vel: { value: null }, src: { value: null }, dt: { value: 0 }, dissipation: { value: 0 } }),
    divergence: mat(FS.divergence, { vel: { value: null } }),
    curl: mat(FS.curl, { vel: { value: null } }),
    vorticity: mat(FS.vorticity, { vel: { value: null }, curl: { value: null }, strength: { value: 22 }, dt: { value: 0 } }),
    clear: mat(FS.clear, { tex: { value: null }, value: { value: 0.8 } }),
    pressure: mat(FS.pressure, { pressure: { value: null }, divergence: { value: null } }),
    gradient: mat(FS.gradient, { pressure: { value: null }, vel: { value: null } }),
    display: mat(FS.display, { dye: { value: null }, bg: { value: new THREE.Color(bg) }, ink: { value: new THREE.Color(ink) }, deep: { value: new THREE.Color(deep) } }),
  };
  function run(m, target, w, h) {
    m.uniforms.texel.value.set(1 / w, 1 / h);
    quad.material = m;
    renderer.setRenderTarget(target);
    renderer.render(scene, cam);
  }

  let W = 1, Hh = 1;
  function resize() {
    W = canvas.clientWidth; Hh = canvas.clientHeight;
    renderer.setSize(W, Hh, false);
    alloc();
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const splats = [];
  function splat(x, y, dx, dy, amount = 1, radius = 0.0022) {
    splats.push([x, y, dx, dy, amount, radius]);
  }
  function applySplat([x, y, dx, dy, amount, radius]) {
    const s = P.splat.uniforms;
    s.aspect.value = W / Hh; s.point.value.set(x, y); s.radius.value = radius;
    s.tex.value = vel.a.texture; s.color.value.set(dx, dy, 0); run(P.splat, vel.b, vel.w, vel.h); vel.swap();
    s.tex.value = dye.a.texture; s.color.value.set(amount, 0, 0); s.radius.value = radius * 1.15; run(P.splat, dye.b, dye.w, dye.h); dye.swap();
  }

  function step(dt) {
    while (splats.length) applySplat(splats.shift());
    P.curl.uniforms.vel.value = vel.a.texture; run(P.curl, curl, vel.w, vel.h);
    Object.assign(P.vorticity.uniforms, {}); P.vorticity.uniforms.vel.value = vel.a.texture; P.vorticity.uniforms.curl.value = curl.texture; P.vorticity.uniforms.dt.value = dt;
    run(P.vorticity, vel.b, vel.w, vel.h); vel.swap();
    P.divergence.uniforms.vel.value = vel.a.texture; run(P.divergence, div, vel.w, vel.h);
    P.clear.uniforms.tex.value = pressure.a.texture; run(P.clear, pressure.b, vel.w, vel.h); pressure.swap();
    P.pressure.uniforms.divergence.value = div.texture;
    for (let i = 0; i < 18; i++) { P.pressure.uniforms.pressure.value = pressure.a.texture; run(P.pressure, pressure.b, vel.w, vel.h); pressure.swap(); }
    P.gradient.uniforms.pressure.value = pressure.a.texture; P.gradient.uniforms.vel.value = vel.a.texture; run(P.gradient, vel.b, vel.w, vel.h); vel.swap();
    const a = P.advect.uniforms; a.dt.value = dt;
    a.vel.value = vel.a.texture; a.src.value = vel.a.texture; a.dissipation.value = 0.25; run(P.advect, vel.b, vel.w, vel.h); vel.swap();
    a.vel.value = vel.a.texture; a.src.value = dye.a.texture; a.dissipation.value = 0.32; run(P.advect, dye.b, vel.w, vel.h); dye.swap();
  }

  // pointer (listens on window so the ink follows the cursor over text too)
  let px = -1, py = -1, visible = true;
  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) { px = -1; return; }
    if (px >= 0) {
      const dx = (x - px) * W * 6, dy = (y - py) * Hh * 6;
      const sp = Math.hypot(dx, dy);
      if (sp > 1) splat(x, y, dx, dy, Math.min(0.06 + sp * 0.0016, 0.5));
    }
    px = x; py = y;
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  const onDown = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) drip(x, y, 1.6);
  };
  window.addEventListener('pointerdown', onDown, { passive: true });

  function drip(x, y, amt = 1.2) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.random();
      splat(x, y, Math.cos(a) * 260, Math.sin(a) * 260, amt * 0.35, 0.0016);
    }
    splat(x, y, 0, -60, amt, 0.004);
  }

  let raf = 0, last = performance.now(), autoT = 0.4;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    if (!visible) return;
    if (auto) {
      autoT -= dt;
      if (autoT < 0) {
        autoT = 2.6 + Math.random() * 2.4;
        drip(0.15 + Math.random() * 0.7, 0.2 + Math.random() * 0.6, 0.8 + Math.random() * 0.8);
      }
    }
    step(dt);
    P.display.uniforms.dye.value = dye.a.texture;
    run(P.display, null, W, Hh);
  }
  raf = requestAnimationFrame(frame);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = performance.now(); });
  io.observe(canvas);

  return {
    drip,
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown);
      renderer.dispose();
    },
  };
}
