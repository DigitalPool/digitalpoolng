// GPU height-field wave simulation (ping-pong render targets).
// R = height, G = velocity. Drops are queued and applied before each step.
import * as THREE from 'three';

const VS = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const UPDATE = /* glsl */ `
precision highp float;
uniform sampler2D tex; uniform vec2 delta; uniform float damping; varying vec2 vUv;
void main(){
  vec4 info = texture2D(tex, vUv);
  vec2 dx = vec2(delta.x, 0.0), dy = vec2(0.0, delta.y);
  float avg = (texture2D(tex, vUv - dx).r + texture2D(tex, vUv + dx).r +
               texture2D(tex, vUv - dy).r + texture2D(tex, vUv + dy).r) * 0.25;
  info.g += (avg - info.r) * 2.0;
  info.g *= damping;
  info.r += info.g;
  // soak up energy at the borders so waves fade instead of bouncing back
  float e = smoothstep(0.0, 0.08, vUv.x) * smoothstep(0.0, 0.08, vUv.y) *
            smoothstep(1.0, 0.92, vUv.x) * smoothstep(1.0, 0.92, vUv.y);
  info.rg *= mix(0.86, 1.0, e);
  gl_FragColor = info;
}`;

const DROP = /* glsl */ `
precision highp float;
#define PI 3.14159265
uniform sampler2D tex; uniform vec2 center; uniform float radius; uniform float strength; uniform float aspect; varying vec2 vUv;
void main(){
  vec4 info = texture2D(tex, vUv);
  vec2 d = (center - vUv); d.x *= aspect;
  float drop = max(0.0, 1.0 - length(d) / radius);
  drop = 0.5 - cos(drop * PI) * 0.5;
  info.r += drop * strength;
  gl_FragColor = info;
}`;

export class WaveSim {
  constructor(renderer, size = 256) {
    this.r = renderer;
    this.size = size;
    const opts = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.a = new THREE.WebGLRenderTarget(size, size, opts);
    this.b = new THREE.WebGLRenderTarget(size, size, opts);
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.scene.add(this.quad);
    this.update = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, delta: { value: new THREE.Vector2(1 / size, 1 / size) }, damping: { value: 0.986 } },
      vertexShader: VS,
      fragmentShader: UPDATE,
    });
    this.dropMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, center: { value: new THREE.Vector2() }, radius: { value: 0.03 }, strength: { value: 0.01 }, aspect: { value: 1 } },
      vertexShader: VS,
      fragmentShader: DROP,
    });
    this.queue = [];
    // zero both targets
    const prev = renderer.getRenderTarget();
    const cc = renderer.getClearColor(new THREE.Color()); const ca = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    for (const t of [this.a, this.b]) { renderer.setRenderTarget(t); renderer.clear(); }
    renderer.setClearColor(cc, ca);
    renderer.setRenderTarget(prev);
  }

  get texture() { return this.a.texture; }

  drop(u, v, radius = 0.03, strength = 0.01) {
    if (u < 0 || u > 1 || v < 0 || v > 1) return;
    if (this.queue.length < 24) this.queue.push([u, v, radius, strength]);
  }

  pass(mat) {
    mat.uniforms.tex.value = this.a.texture;
    this.quad.material = mat;
    this.r.setRenderTarget(this.b);
    this.r.render(this.scene, this.cam);
    [this.a, this.b] = [this.b, this.a];
  }

  step(iterations = 2) {
    const prev = this.r.getRenderTarget();
    const ac = this.r.autoClear; this.r.autoClear = false;
    for (const [u, v, radius, strength] of this.queue) {
      const d = this.dropMat.uniforms;
      d.center.value.set(u, v); d.radius.value = radius; d.strength.value = strength;
      this.pass(this.dropMat);
    }
    this.queue.length = 0;
    for (let i = 0; i < iterations; i++) this.pass(this.update);
    this.r.autoClear = ac;
    this.r.setRenderTarget(prev);
  }

  dispose() { this.a.dispose(); this.b.dispose(); this.update.dispose(); this.dropMat.dispose(); }
}
