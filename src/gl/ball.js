// The "talk" pool ball in the top-right corner: a glossy red ball with the DigitalPool
// nib in its white circle. Flick it to spin, it rolls when you scroll, idles by looking
// at the cursor, and clicking it opens Contact. A ring of text orbits around it.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function ballTexture(onReady) {
  const W = 1024, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const draw = (logo) => {
    g.fillStyle = '#e8323d'; g.fillRect(0, 0, W, H);
    // u = 0.25 faces the camera on a three.js sphere; u = 0.75 is the back
    for (const x of [W * 0.25, W * 0.75]) {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(x, H / 2, 92, 0, Math.PI * 2); g.fill();
      if (logo) { const s = 128; g.drawImage(logo, x - s / 2, H / 2 - s / 2, s, s); }
    }
    tex.needsUpdate = true;
    onReady?.();
  };
  draw(null);
  const img = new Image();
  img.onload = () => draw(img);
  img.src = '/assets/brand/logo.png';
  return tex;
}

export function createBall(canvas, { ring, getScrollVelocity = () => 0, reduceMotion = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 3, 4); scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 4.3);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1, 72, 48),
    new THREE.MeshPhysicalMaterial({ map: ballTexture(), roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.2 }),
  );
  scene.add(ball);

  function resize() {
    const s = Math.max(1, canvas.clientWidth);
    renderer.setSize(s, s, false);
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  // ── state
  const w = new THREE.Vector3(0, 0.6, 0); // angular velocity (world, rad/s)
  const qTarget = new THREE.Quaternion(), dq = new THREE.Quaternion(), tmp = new THREE.Vector3();
  const FRONT = new THREE.Vector3(0, 0, 1);
  let mx = innerWidth / 2, my = innerHeight / 2, hover = 0, hoverT = 0, scale = 1, ringA = 0, ringSpeed = 0.25;
  let dragging = false, dragged = false, lx = 0, ly = 0, lastT = 0;

  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  const host = canvas.closest('a, button') || canvas;
  host.addEventListener('pointerenter', () => { hoverT = 1; });
  host.addEventListener('pointerleave', () => { hoverT = 0; });
  host.addEventListener('pointerdown', (e) => {
    dragging = true; dragged = false; lx = e.clientX; ly = e.clientY; lastT = performance.now();
    host.setPointerCapture?.(e.pointerId);
  });
  host.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now(), dt = Math.max(8, now - lastT) / 1000;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
    // drag right spins around +Y, drag down spins around +X (like rolling it under your finger)
    w.set(dy, dx, 0).multiplyScalar(0.045 / dt);
    w.clampLength(0, 40);
    lx = e.clientX; ly = e.clientY; lastT = now;
  });
  const up = (e) => { if (!dragging) return; dragging = false; host.releasePointerCapture?.(e.pointerId); };
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', up);
  // a drag is a spin, not a click
  host.addEventListener('click', (e) => {
    if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; return; }
    w.y += 24; // a celebratory spin while the page transition pours in
  }, true);

  let raf = 0, last = performance.now(), visible = !document.hidden;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; last = performance.now(); });

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!visible) return;

    // roll with the page
    const sv = getScrollVelocity();
    if (!reduceMotion) w.x += sv * 0.035;

    // integrate spin
    const speed = w.length();
    if (speed > 1e-4) {
      dq.setFromAxisAngle(tmp.copy(w).normalize(), speed * dt);
      ball.quaternion.premultiply(dq);
    }
    if (!dragging) w.multiplyScalar(Math.pow(0.35, dt)); // friction

    // when calm, turn the logo to look at the cursor
    if (!dragging && speed < 2.5) {
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      tmp.set(Math.max(-0.55, Math.min(0.55, (mx - cx) / innerWidth * 0.9)), Math.max(-0.55, Math.min(0.55, -(my - cy) / innerHeight * 0.9)), 1).normalize();
      qTarget.setFromUnitVectors(FRONT, tmp);
      ball.quaternion.slerp(qTarget, 1 - Math.pow(0.02, dt * (1 - speed / 2.5)));
    }

    // hover/proximity
    const r = canvas.getBoundingClientRect();
    const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
    const near = Math.max(0, 1 - d / 260);
    hover += (Math.max(hoverT, near * 0.6) - hover) * (1 - Math.pow(0.001, dt));
    scale += ((1 + hover * 0.1 + (dragging ? -0.06 : 0)) - scale) * (1 - Math.pow(0.0005, dt));
    ball.scale.setScalar(scale);

    // orbiting text speeds up as you approach, and with scroll/spin
    ringSpeed = 0.22 + hover * 1.4 + Math.min(Math.abs(sv) * 0.05, 1.2) + Math.min(speed * 0.04, 1);
    ringA = (ringA + ringSpeed * dt * 60) % 360;
    if (ring) ring.style.transform = `rotate(${reduceMotion ? 0 : ringA}deg)`;

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return { dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); } };
}
