// "The Pool": a white, reflective pool with a live ripple simulation and floating
// glossy objects you can stir, splash, grab and throw. Used on Home and Contact.
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { WaveSim } from './wavesim.js';

const SIZE = 26; // world size of the simulated water square
const MAXS = 16; // max contact shadows

const WaterShader = {
  name: 'PoolWater',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    tHeight: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uBg: { value: new THREE.Color() },
    uCam: { value: new THREE.Vector3() },
    uFocus: { value: new THREE.Vector2() },
    uFade: { value: new THREE.Vector2(5, 12) },
    uNormal: { value: 9 },
    uShadows: { value: Array.from({ length: MAXS }, () => new THREE.Vector4(0, 0, 0, 99)) },
    uCount: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUvR; varying vec3 vWorld;
    void main(){
      vUvR = textureMatrix * vec4(position, 1.0);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform sampler2D tHeight;
    uniform vec2 uTexel; uniform vec3 uBg; uniform vec3 uCam; uniform vec2 uFocus; uniform vec2 uFade;
    uniform float uNormal; uniform vec4 uShadows[${MAXS}]; uniform int uCount; uniform float uTime;
    varying vec4 vUvR; varying vec3 vWorld;
    void main(){
      vec2 suv = vWorld.xz / ${SIZE.toFixed(1)} + 0.5;
      // wide, smoothed gradient so ripples read as liquid rather than a grid
      vec2 ex = vec2(uTexel.x * 1.5, 0.0), ey = vec2(0.0, uTexel.y * 1.5);
      float hL = texture2D(tHeight, suv - ex).r + 0.5 * (texture2D(tHeight, suv - ex - ey).r + texture2D(tHeight, suv - ex + ey).r);
      float hR = texture2D(tHeight, suv + ex).r + 0.5 * (texture2D(tHeight, suv + ex - ey).r + texture2D(tHeight, suv + ex + ey).r);
      float hD = texture2D(tHeight, suv - ey).r + 0.5 * (texture2D(tHeight, suv - ey - ex).r + texture2D(tHeight, suv - ey + ex).r);
      float hU = texture2D(tHeight, suv + ey).r + 0.5 * (texture2D(tHeight, suv + ey - ex).r + texture2D(tHeight, suv + ey + ex).r);
      vec3 n = normalize(vec3((hL - hR) * uNormal * 0.25, 1.0, (hD - hU) * uNormal * 0.25));
      vec3 V = normalize(uCam - vWorld);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, V), 0.0), 5.0);

      vec4 ruv = vUvR; ruv.xy += n.xz * 0.085 * ruv.w;
      vec3 refl = texture2DProj(tDiffuse, ruv).rgb;
      vec3 base = uBg * 0.982;
      vec3 col = mix(base, refl, 0.38 + 0.62 * fres);

      // ripple lighting: darken slopes facing away, brighten the ones facing the light
      vec3 L = normalize(vec3(-0.4, 1.0, 0.55));
      float lit = (dot(n, L) - L.y) * clamp(V.y * 2.2, 0.25, 1.0); // calmer at grazing angles
      col *= 1.0 + lit * 2.6;
      vec3 H = normalize(L + V);
      col += pow(max(dot(n, H), 0.0), 260.0) * 0.35;
      // faint red caustic in the troughs
      col = mix(col, col * vec3(1.0, 0.86, 0.86), clamp(-lit * 6.0, 0.0, 0.5));

      // soft contact shadows under floating objects
      float sh = 0.0;
      for (int i = 0; i < ${MAXS}; i++) {
        if (i >= uCount) break;
        vec4 s = uShadows[i];
        float hgt = max(s.w, 0.0);
        vec2 d = vWorld.xz - (s.xy + vec2(0.22, -0.3) * hgt);
        float r = s.z * (1.05 + hgt * 0.7);
        sh += (1.0 - smoothstep(0.0, r, length(d))) * 0.5 / (1.0 + hgt * 1.6);
      }
      col *= 1.0 - clamp(sh, 0.0, 0.5);

      float dist = length(vWorld.xz - uFocus);
      col = mix(col, uBg, smoothstep(uFade.x, uFade.y, dist));
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
};

const RED = 0xe8323d;

function materials() {
  return {
    red: new THREE.MeshPhysicalMaterial({ color: RED, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    deep: new THREE.MeshPhysicalMaterial({ color: 0xa50f1c, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04 }),
    white: new THREE.MeshPhysicalMaterial({ color: 0xf3f1ed, roughness: 0.34, clearcoat: 0.9, clearcoatRoughness: 0.12 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 1, thickness: 1.1, roughness: 0.03, ior: 1.5,
      attenuationColor: new THREE.Color(0xff7a80), attenuationDistance: 1.2, clearcoat: 1, clearcoatRoughness: 0.02,
    }),
  };
}

// [geometry factory, material, home position, collision radius, rotation]
function layout(preset) {
  const G = {
    ring: () => new THREE.TorusGeometry(0.95, 0.36, 64, 160),
    ball: (r) => () => new THREE.SphereGeometry(r, 64, 48),
    pill: (r, l) => () => new THREE.CapsuleGeometry(r, l, 16, 40),
    box: (s) => () => new RoundedBoxGeometry(s, s, s, 8, s * 0.2),
    knot: () => new THREE.TorusKnotGeometry(0.42, 0.14, 220, 28),
    hoop: () => new THREE.TorusGeometry(0.56, 0.06, 24, 140),
    cone: () => new THREE.ConeGeometry(0.42, 0.95, 64, 1),
  };
  if (preset === 'contact') {
    return [
      [G.ring, 'red', [0.2, 0.12, 0], 1.25, [1.3, 0.1, 0.2]],
      [G.ball(0.6), 'white', [2.4, 0.5, 0.6], 0.6, [0, 0, 0]],
      [G.box(0.8), 'glass', [-2.0, 1.4, -0.8], 0.7, [0.5, 0.6, 0.2]],
      [G.ball(0.34), 'chrome', [-0.9, 1.7, 1.0], 0.34, [0, 0, 0]],
      [G.pill(0.2, 0.6), 'deep', [1.6, 1.9, -1.3], 0.5, [0.4, 0, 1.1]],
    ];
  }
  return [
    [G.ring, 'red', [1.5, 0.12, -0.3], 1.25, [1.28, 0.2, 0.3]],
    [G.ball(0.72), 'white', [3.6, 0.55, 0.75], 0.72, [0, 0, 0]],
    [G.pill(0.28, 1.2), 'chrome', [0.6, 0.75, 1.6], 0.78, [0.3, 0.4, 1.2]],
    [G.ball(0.36), 'red', [-0.2, 1.5, -0.6], 0.36, [0, 0, 0]],
    [G.box(0.95), 'glass', [2.9, 2.1, -1.6], 0.8, [0.6, 0.5, 0.2]],
    [G.knot, 'white', [-0.7, 1.9, -2.6], 0.75, [0.4, 0.2, 0]],
    [G.pill(0.22, 0.62), 'red', [4.9, 0.28, -0.9], 0.55, [1.4, 0.3, 0.2]],
    [G.hoop, 'chrome', [0.95, 2.4, 0.4], 0.6, [1.1, 0.3, 0]],
    [G.ball(0.48), 'chrome', [5.4, 1.5, 0.9], 0.48, [0, 0, 0]],
    [G.ball(0.22), 'deep', [2.4, 1.0, 2.0], 0.22, [0, 0, 0]],
  ];
}

export function createPool(canvas, { preset = 'home', bg = '#fbfbf9', onHover } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.classList.add('is-fallback');
    return null;
  }
  const DPR = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const bgColor = new THREE.Color(bg);
  renderer.setClearColor(bgColor, 1);

  const scene = new THREE.Scene();
  scene.background = bgColor;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.0;
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-4, 8, 5);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf2d7d7, 0.5));

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  const sim = new WaveSim(renderer, touch ? 224 : 320);
  const water = new Reflector(new THREE.PlaneGeometry(SIZE, SIZE), {
    shader: WaterShader, textureWidth: 512, textureHeight: 512, clipBias: 0.003, multisample: 0,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);
  const U = water.material.uniforms;
  U.uBg.value.copy(bgColor);
  U.uTexel.value.set(1 / sim.size, 1 / sim.size);

  // ── bodies
  const M = materials();
  const bodies = layout(preset).map(([geo, mat, p, r, rot], i) => {
    const mesh = new THREE.Mesh(geo(), M[mat]);
    mesh.rotation.set(...rot);
    scene.add(mesh);
    const home = new THREE.Vector3(...p);
    return {
      mesh, r, home,
      pos: home.clone().add(new THREE.Vector3(0, 6 + i * 0.6, 0)), // they drop in on start
      vel: new THREE.Vector3(),
      ang: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, 0),
      phase: Math.random() * Math.PI * 2,
      bob: 0.06 + Math.random() * 0.08,
      bobS: 0.7 + Math.random() * 0.6,
      wasAbove: true,
    };
  });

  // tiny red droplets scattered across the pool
  const dropGeo = new THREE.SphereGeometry(1, 24, 16);
  const droplets = [];
  const dropCount = preset === 'contact' ? 8 : 16;
  for (let i = 0; i < dropCount; i++) {
    const m = new THREE.Mesh(dropGeo, i % 3 ? M.red : M.deep);
    const s = 0.05 + Math.random() * 0.1;
    m.scale.setScalar(s);
    const x = (Math.random() - 0.4) * 16, z = (Math.random() - 0.65) * 9;
    m.position.set(x, s * 0.3, z);
    scene.add(m);
    droplets.push({ m, s, x, z, ph: Math.random() * 6.28, sp: 0.8 + Math.random() });
  }

  // ── layout / camera
  let W = 1, H = 1, mobile = false;
  const camBase = new THREE.Vector3(), lookBase = new THREE.Vector3();
  const camTop = new THREE.Vector3(), lookTop = new THREE.Vector3();
  let shiftX = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    mobile = W / H < 0.9;
    camera.fov = mobile ? 50 : 34;
    camera.updateProjectionMatrix();
    shiftX = preset === 'contact' ? (mobile ? 0 : 3.4) : mobile ? -1.6 : 0;
    if (preset === 'contact') {
      camBase.set(mobile ? 0 : 1.2, mobile ? 6 : 4.6, mobile ? 11.5 : 10); lookBase.set(mobile ? 0 : 1.6, 0.5, 0);
      camTop.set(0, 9, 6); lookTop.set(0, 0, 0);
    } else {
      camBase.set(mobile ? 0 : -0.2, mobile ? 4.6 : 3.4, mobile ? 13 : 11.6);
      lookBase.set(mobile ? 0 : 0.15, mobile ? 1.2 : 0.75, 0);
      camTop.set(1.2 + shiftX, 10, 4.5); lookTop.set(1.2 + shiftX, 0, -0.5);
    }
    const q = touch ? 0.6 : 0.85;
    const rtW = Math.round(W * DPR * q), rtH = Math.round(H * DPR * q);
    water.getRenderTarget().setSize(rtW, rtH);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // ── pointer
  const ndc = new THREE.Vector2(9, 9), ndcPrev = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2(), parallaxT = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  let pointerIn = false, hovered = null, grabbed = null;
  const grabPlane = new THREE.Plane(), grabPoint = new THREE.Vector3(), grabOffset = new THREE.Vector3();
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

  function setNdc(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    parallaxT.set(ndc.x, ndc.y);
  }
  function waterHit(out) {
    const o = ray.ray.origin, d = ray.ray.direction;
    if (d.y > -1e-4) return false;
    const t = -o.y / d.y;
    out.copy(o).addScaledVector(d, t);
    return true;
  }
  function pickBody() {
    let best = null, bestT = Infinity;
    for (const b of bodies) {
      const t = tmp.copy(b.pos).sub(ray.ray.origin).dot(ray.ray.direction);
      if (t < 0) continue;
      ray.ray.at(t, tmp2);
      if (tmp2.distanceTo(b.pos) < b.r * 1.05 && t < bestT) { best = b; bestT = t; }
    }
    return best;
  }
  const toUV = (x, z) => [x / SIZE + 0.5, z / SIZE + 0.5];

  function onMove(e) {
    setNdc(e); pointerIn = true;
    ray.setFromCamera(ndc, camera);
    if (grabbed) {
      if (ray.ray.intersectPlane(grabPlane, grabPoint)) grabPoint.add(grabOffset);
      return;
    }
    const h = pickBody();
    if (h !== hovered) { hovered = h; onHover?.(h ? 'grab' : 'water'); }
  }
  function onDown(e) {
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const b = !touch && pickBody();
    if (b) {
      grabbed = b;
      camera.getWorldDirection(tmp);
      grabPlane.setFromNormalAndCoplanarPoint(tmp.negate(), b.pos);
      ray.ray.intersectPlane(grabPlane, grabPoint);
      grabOffset.copy(b.pos).sub(grabPoint);
      grabPoint.add(grabOffset);
      canvas.setPointerCapture?.(e.pointerId);
      onHover?.('grabbing');
      return;
    }
    if (waterHit(tmp)) splashAt(tmp.x, tmp.z, 1);
  }
  function onUp(e) {
    if (grabbed) {
      canvas.releasePointerCapture?.(e.pointerId);
      grabbed = null;
      onHover?.(hovered ? 'grab' : 'water');
    }
  }
  function onLeave() { pointerIn = false; hovered = null; ndc.set(9, 9); onHover?.(null); }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  function splashAt(x, z, power = 1) {
    const [u, v] = toUV(x, z);
    sim.drop(u, v, 0.05 * Math.sqrt(power), -0.9 * power);
    sim.drop(u, v, 0.02, 0.5 * power);
    for (const b of bodies) {
      const d = Math.hypot(b.pos.x - x, b.pos.z - z);
      if (d < 3.2) {
        const f = (1 - d / 3.2) * 5 * power;
        b.vel.y += f;
        b.vel.x += ((b.pos.x - x) / (d + 0.1)) * f * 0.35;
        b.vel.z += ((b.pos.z - z) / (d + 0.1)) * f * 0.35;
        b.ang.x += (Math.random() - 0.5) * f; b.ang.z += (Math.random() - 0.5) * f;
      }
    }
  }

  // ── loop
  let scrollP = 0, running = true, visible = true, raf = 0, last = performance.now(), t = 0, idleT = 0;
  const lookAt = new THREE.Vector3();
  const shadows = U.uShadows.value;

  function physics(dt) {
    const k = 7, damp = 2.4;
    const spread = 1 + scrollP * 0.5;
    for (const b of bodies) {
      tmp.copy(b.home); tmp.x = (tmp.x - 1.4) * spread + 1.4 + shiftX; tmp.z *= spread;
      tmp.y += Math.sin(t * b.bobS + b.phase) * b.bob + scrollP * 1.2;
      if (b === grabbed) {
        tmp.copy(grabPoint); tmp.y = Math.max(tmp.y, -b.r * 0.3);
        b.vel.lerp(tmp2.copy(tmp).sub(b.pos).multiplyScalar(14), 0.5);
      } else {
        b.vel.addScaledVector(tmp.sub(b.pos), k * dt);
        // gravity-ish pull keeps thrown objects arcing back to the water
        if (b.pos.y > b.home.y + 0.5) b.vel.y -= 9 * dt;
        b.vel.multiplyScalar(Math.max(0, 1 - damp * dt));
      }
      // cursor stirs nearby objects
      if (pointerIn && !grabbed) {
        const tt = tmp.copy(b.pos).sub(ray.ray.origin).dot(ray.ray.direction);
        ray.ray.at(tt, tmp2);
        const d = tmp2.distanceTo(b.pos), R = b.r + 0.9;
        if (d < R) {
          const mv = Math.min(ndc.distanceTo(ndcPrev) * 40, 3);
          tmp.copy(b.pos).sub(tmp2).normalize().multiplyScalar((1 - d / R) * (6 + mv * 10) * dt);
          b.vel.add(tmp);
          b.ang.x += tmp.z * 2; b.ang.z -= tmp.x * 2;
        }
      }
    }
    // collisions
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], c = bodies[j];
      tmp.copy(c.pos).sub(a.pos);
      const d = tmp.length(), min = (a.r + c.r) * 0.92;
      if (d > 0 && d < min) {
        tmp.multiplyScalar(1 / d);
        const push = (min - d) * 0.5;
        a.pos.addScaledVector(tmp, -push); c.pos.addScaledVector(tmp, push);
        const rel = tmp2.copy(c.vel).sub(a.vel).dot(tmp);
        if (rel < 0) { a.vel.addScaledVector(tmp, rel * 0.8); c.vel.addScaledVector(tmp, -rel * 0.8); }
      }
    }
    let si = 0;
    for (const b of bodies) {
      b.pos.addScaledVector(b.vel, dt);
      const m = b.mesh;
      m.position.copy(b.pos);
      m.rotation.x += (b.ang.x * 0.5 + 0.05) * dt;
      m.rotation.y += (b.ang.y * 0.5 + 0.12) * dt;
      m.rotation.z += b.ang.z * 0.5 * dt;
      b.ang.multiplyScalar(Math.max(0, 1 - 1.2 * dt));
      // water interaction
      const [u, v] = toUV(b.pos.x, b.pos.z);
      const sub = b.r - Math.abs(b.pos.y);
      if (sub > 0) {
        const speed = Math.hypot(b.vel.x, b.vel.z);
        const s = (-b.vel.y * 0.012 + speed * 0.006) * Math.min(1, sub / b.r + 0.3);
        if (Math.abs(s) > 0.0005) sim.drop(u, v, (b.r / SIZE) * 0.9, -s);
      }
      const above = b.pos.y > b.r * 0.4;
      if (b.wasAbove && !above && b.vel.y < -2) sim.drop(u, v, (b.r / SIZE) * 2.2, Math.max(-1.4, b.vel.y * 0.12));
      b.wasAbove = above;
      if (si < MAXS) shadows[si++].set(b.pos.x, b.pos.z, b.r * 1.1, b.pos.y - b.r * 0.2);
    }
    for (const d of droplets) {
      const y = Math.sin(t * d.sp + d.ph) * d.s * 0.35 + d.s * 0.2;
      d.m.position.set(d.x + shiftX, y, d.z);
      if (Math.random() < 0.02) { const [u, v] = toUV(d.x + shiftX, d.z); sim.drop(u, v, 0.008, -0.04); }
      if (si < MAXS) shadows[si++].set(d.x + shiftX, d.z, d.s * 1.6, 0);
    }
    U.uCount.value = si;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (!visible) return;
    t += dt;

    ray.setFromCamera(ndc, camera);
    // cursor ripples
    if (pointerIn && !grabbed) {
      const mv = ndc.distanceTo(ndcPrev);
      if (mv > 0.002 && waterHit(tmp)) {
        const [u, v] = toUV(tmp.x, tmp.z);
        sim.drop(u, v, 0.016, -Math.min(mv * 3.2, 0.16));
      }
    }
    // ambient drops when idle or on touch
    idleT -= dt;
    if (idleT < 0) {
      idleT = touch || !pointerIn ? 0.9 + Math.random() * 1.2 : 2.5 + Math.random() * 3;
      const x = (Math.random() - 0.35) * 10 + shiftX, z = (Math.random() - 0.6) * 6;
      const [u, v] = toUV(x, z);
      sim.drop(u, v, 0.012 + Math.random() * 0.012, -0.18 - Math.random() * 0.2);
    }
    physics(dt);
    ndcPrev.copy(ndc);
    sim.step(reduce ? 1 : 2);
    U.tHeight.value = sim.texture;

    // camera
    parallax.lerp(parallaxT, 0.05);
    const p = scrollP * scrollP * (3 - 2 * scrollP);
    camera.position.lerpVectors(camBase, camTop, p);
    camera.position.x += parallax.x * (mobile ? 0.3 : 0.7) * (1 - p);
    camera.position.y += parallax.y * 0.35 * (1 - p);
    lookAt.lerpVectors(lookBase, lookTop, p);
    camera.lookAt(lookAt);
    U.uCam.value.copy(camera.position);
    U.uFocus.value.set(lookAt.x, lookAt.z);
    U.uFade.value.set(mobile ? 4 : 5.5, mobile ? 10 : 13);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting && !document.hidden; }, { threshold: 0 });
  io.observe(canvas);
  const onVis = () => { visible = !document.hidden; last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);

  return {
    setScroll(v) { scrollP = Math.min(1, Math.max(0, v)); },
    splash(x = 1.4, z = 0, power = 1.2) { splashAt(x + shiftX, z, power); },
    splashScreen(cx, cy, power = 1) {
      const rect = canvas.getBoundingClientRect();
      ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (waterHit(tmp)) splashAt(tmp.x, tmp.z, power);
      ndc.set(9, 9);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerup', onUp);
      sim.dispose(); renderer.dispose();
    },
  };
}
