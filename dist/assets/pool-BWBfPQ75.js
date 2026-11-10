import{M as F,d as qe,C as J,e as Ee,b as g,f as Ae,g as Se,c as ze,H as Ge,a as Re,U as Ye,S as Ce,B as je,h as Ve,i as Ze,j as Je,k as Qe,L as Be,R as et,O as tt,P as Oe,V as E,W as ot,N as at,l as nt,D as st,m as rt,n as Ne,o as it,p as ae,T as Ie,q as lt,r as ct,s as ut}from"./three.module-BliFmUBb.js";class de extends F{constructor(t,a={}){super(t),this.isReflector=!0,this.type="Reflector",this.camera=new qe;const r=this,v=a.color!==void 0?new J(a.color):new J(8355711),l=a.textureWidth||512,f=a.textureHeight||512,y=a.clipBias||0,n=a.shader||de.ReflectorShader,w=a.multisample!==void 0?a.multisample:4,b=new Ee,D=new g,i=new g,S=new g,d=new Ae,R=new g(0,0,-1),p=new Se,h=new g,j=new g,G=new Se,O=new Ae,P=this.camera,I=new ze(l,f,{samples:w,type:Ge}),C=new Re({name:n.name!==void 0?n.name:"unspecified",uniforms:Ye.clone(n.uniforms),fragmentShader:n.fragmentShader,vertexShader:n.vertexShader});C.uniforms.tDiffuse.value=I.texture,C.uniforms.color.value=v,C.uniforms.textureMatrix.value=O,this.material=C,this.onBeforeRender=function(U,Q,_){if(i.setFromMatrixPosition(r.matrixWorld),S.setFromMatrixPosition(_.matrixWorld),d.extractRotation(r.matrixWorld),D.set(0,0,1),D.applyMatrix4(d),h.subVectors(i,S),h.dot(D)>0)return;h.reflect(D).negate(),h.add(i),d.extractRotation(_.matrixWorld),R.set(0,0,-1),R.applyMatrix4(d),R.add(S),j.subVectors(i,R),j.reflect(D).negate(),j.add(i),P.position.copy(h),P.up.set(0,1,0),P.up.applyMatrix4(d),P.up.reflect(D),P.lookAt(j),P.far=_.far,P.updateMatrixWorld(),P.projectionMatrix.copy(_.projectionMatrix),O.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),O.multiply(P.projectionMatrix),O.multiply(P.matrixWorldInverse),O.multiply(r.matrixWorld),b.setFromNormalAndCoplanarPoint(D,i),b.applyMatrix4(P.matrixWorldInverse),p.set(b.normal.x,b.normal.y,b.normal.z,b.constant);const k=P.projectionMatrix;G.x=(Math.sign(p.x)+k.elements[8])/k.elements[0],G.y=(Math.sign(p.y)+k.elements[9])/k.elements[5],G.z=-1,G.w=(1+k.elements[10])/k.elements[14],p.multiplyScalar(2/p.dot(G)),k.elements[2]=p.x,k.elements[6]=p.y,k.elements[10]=p.z+1-y,k.elements[14]=p.w,r.visible=!1;const B=U.getRenderTarget(),re=U.xr.enabled,ie=U.shadowMap.autoUpdate;U.xr.enabled=!1,U.shadowMap.autoUpdate=!1,U.setRenderTarget(I),U.state.buffers.depth.setMask(!0),U.autoClear===!1&&U.clear(),U.render(Q,P),U.xr.enabled=re,U.shadowMap.autoUpdate=ie,U.setRenderTarget(B);const W=_.viewport;W!==void 0&&U.state.viewport(W),r.visible=!0},this.getRenderTarget=function(){return I},this.dispose=function(){I.dispose(),r.material.dispose()}}}de.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,fragmentShader:`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};class dt extends Ce{constructor(){super();const t=new je;t.deleteAttribute("uv");const a=new Ve({side:Ze}),r=new Ve,v=new Je(16777215,900,28,2);v.position.set(.418,16.199,.3),this.add(v);const l=new F(t,a);l.position.set(-.757,13.219,.717),l.scale.set(31.713,28.305,28.591),this.add(l);const f=new F(t,r);f.position.set(-10.906,2.009,1.846),f.rotation.set(0,-.195,0),f.scale.set(2.328,7.905,4.651),this.add(f);const y=new F(t,r);y.position.set(-5.607,-.754,-.758),y.rotation.set(0,.994,0),y.scale.set(1.97,1.534,3.955),this.add(y);const n=new F(t,r);n.position.set(6.167,.857,7.803),n.rotation.set(0,.561,0),n.scale.set(3.927,6.285,3.687),this.add(n);const w=new F(t,r);w.position.set(-2.017,.018,6.124),w.rotation.set(0,.333,0),w.scale.set(2.002,4.566,2.064),this.add(w);const b=new F(t,r);b.position.set(2.291,-.756,-2.621),b.rotation.set(0,-.286,0),b.scale.set(1.546,1.552,1.496),this.add(b);const D=new F(t,r);D.position.set(-2.193,-.369,-5.547),D.rotation.set(0,.516,0),D.scale.set(3.875,3.487,2.986),this.add(D);const i=new F(t,Z(50));i.position.set(-16.116,14.37,8.208),i.scale.set(.1,2.428,2.739),this.add(i);const S=new F(t,Z(50));S.position.set(-16.109,18.021,-8.207),S.scale.set(.1,2.425,2.751),this.add(S);const d=new F(t,Z(17));d.position.set(14.904,12.198,-1.832),d.scale.set(.15,4.265,6.331),this.add(d);const R=new F(t,Z(43));R.position.set(-.462,8.89,14.52),R.scale.set(4.38,5.441,.088),this.add(R);const p=new F(t,Z(20));p.position.set(3.235,11.486,-12.541),p.scale.set(2.5,2,.1),this.add(p);const h=new F(t,Z(100));h.position.set(0,20,0),h.scale.set(1,.1,1),this.add(h)}dispose(){const t=new Set;this.traverse(a=>{a.isMesh&&(t.add(a.geometry),t.add(a.material))});for(const a of t)a.dispose()}}function Z(x){const t=new Qe;return t.color.setScalar(x),t}const ne=new g;function V(x,t,a,r,v,l){const f=2*Math.PI*v/4,y=Math.max(l-2*v,0),n=Math.PI/4;ne.copy(t),ne[r]=0,ne.normalize();const w=.5*f/(f+y),b=1-ne.angleTo(x)/n;return Math.sign(ne[a])===1?b*w:y/(f+y)+w+w*(1-b)}class ht extends je{constructor(t=1,a=1,r=1,v=2,l=.1){if(v=v*2+1,l=Math.min(t/2,a/2,r/2,l),super(1,1,1,v,v,v),v===1)return;const f=this.toNonIndexed();this.index=null,this.attributes.position=f.attributes.position,this.attributes.normal=f.attributes.normal,this.attributes.uv=f.attributes.uv;const y=new g,n=new g,w=new g(t,a,r).divideScalar(2).subScalar(l),b=this.attributes.position.array,D=this.attributes.normal.array,i=this.attributes.uv.array,S=b.length/6,d=new g,R=.5/v;for(let p=0,h=0;p<b.length;p+=3,h+=2)switch(y.fromArray(b,p),n.copy(y),n.x-=Math.sign(n.x)*R,n.y-=Math.sign(n.y)*R,n.z-=Math.sign(n.z)*R,n.normalize(),b[p+0]=w.x*Math.sign(y.x)+n.x*l,b[p+1]=w.y*Math.sign(y.y)+n.y*l,b[p+2]=w.z*Math.sign(y.z)+n.z*l,D[p+0]=n.x,D[p+1]=n.y,D[p+2]=n.z,Math.floor(p/S)){case 0:d.set(1,0,0),i[h+0]=V(d,n,"z","y",l,r),i[h+1]=1-V(d,n,"y","z",l,a);break;case 1:d.set(-1,0,0),i[h+0]=1-V(d,n,"z","y",l,r),i[h+1]=1-V(d,n,"y","z",l,a);break;case 2:d.set(0,1,0),i[h+0]=1-V(d,n,"x","z",l,t),i[h+1]=V(d,n,"z","x",l,r);break;case 3:d.set(0,-1,0),i[h+0]=1-V(d,n,"x","z",l,t),i[h+1]=1-V(d,n,"z","x",l,r);break;case 4:d.set(0,0,1),i[h+0]=1-V(d,n,"x","y",l,t),i[h+1]=1-V(d,n,"y","x",l,a);break;case 5:d.set(0,0,-1),i[h+0]=V(d,n,"x","y",l,t),i[h+1]=1-V(d,n,"y","x",l,a);break}}}const _e="varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",ft=`
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
}`,mt=`
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
}`;class pt{constructor(t,a=256){this.r=t,this.size=a;const r={type:Ge,format:et,minFilter:Be,magFilter:Be,depthBuffer:!1,stencilBuffer:!1};this.a=new ze(a,a,r),this.b=new ze(a,a,r),this.scene=new Ce,this.cam=new tt(-1,1,1,-1,0,1),this.quad=new F(new Oe(2,2)),this.scene.add(this.quad),this.update=new Re({uniforms:{tex:{value:null},delta:{value:new E(1/a,1/a)},damping:{value:.986}},vertexShader:_e,fragmentShader:ft}),this.dropMat=new Re({uniforms:{tex:{value:null},center:{value:new E},radius:{value:.03},strength:{value:.01},aspect:{value:1}},vertexShader:_e,fragmentShader:mt}),this.queue=[];const v=t.getRenderTarget(),l=t.getClearColor(new J),f=t.getClearAlpha();t.setClearColor(0,0);for(const y of[this.a,this.b])t.setRenderTarget(y),t.clear();t.setClearColor(l,f),t.setRenderTarget(v)}get texture(){return this.a.texture}drop(t,a,r=.03,v=.01){t<0||t>1||a<0||a>1||this.queue.length<24&&this.queue.push([t,a,r,v])}pass(t){t.uniforms.tex.value=this.a.texture,this.quad.material=t,this.r.setRenderTarget(this.b),this.r.render(this.scene,this.cam),[this.a,this.b]=[this.b,this.a]}step(t=2){const a=this.r.getRenderTarget(),r=this.r.autoClear;this.r.autoClear=!1;for(const[v,l,f,y]of this.queue){const n=this.dropMat.uniforms;n.center.value.set(v,l),n.radius.value=f,n.strength.value=y,this.pass(this.dropMat)}this.queue.length=0;for(let v=0;v<t;v++)this.pass(this.update);this.r.autoClear=r,this.r.setRenderTarget(a)}dispose(){this.a.dispose(),this.b.dispose(),this.update.dispose(),this.dropMat.dispose()}}const X=26,se=16,vt={name:"PoolWater",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},tHeight:{value:null},uTexel:{value:new E},uBg:{value:new J},uCam:{value:new g},uFocus:{value:new E},uFade:{value:new E(5,12)},uNormal:{value:9},uShadows:{value:Array.from({length:se},()=>new Se(0,0,0,99))},uCount:{value:0},uTime:{value:0}},vertexShader:`
    uniform mat4 textureMatrix;
    varying vec4 vUvR; varying vec3 vWorld;
    void main(){
      vUvR = textureMatrix * vec4(position, 1.0);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,fragmentShader:`
    uniform sampler2D tDiffuse; uniform sampler2D tHeight;
    uniform vec2 uTexel; uniform vec3 uBg; uniform vec3 uCam; uniform vec2 uFocus; uniform vec2 uFade;
    uniform float uNormal; uniform vec4 uShadows[${se}]; uniform int uCount; uniform float uTime;
    varying vec4 vUvR; varying vec3 vWorld;
    void main(){
      vec2 suv = vWorld.xz / ${X.toFixed(1)} + 0.5;
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
      for (int i = 0; i < ${se}; i++) {
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
    }`},xt=15217213;function gt(){return{red:new ae({color:xt,roughness:.2,clearcoat:1,clearcoatRoughness:.05}),deep:new ae({color:10817308,roughness:.16,clearcoat:1,clearcoatRoughness:.04}),white:new ae({color:15987181,roughness:.34,clearcoat:.9,clearcoatRoughness:.12}),chrome:new ae({color:16777215,metalness:1,roughness:.07}),glass:new ae({color:16777215,transmission:1,thickness:1.1,roughness:.03,ior:1.5,attenuationColor:new J(16743040),attenuationDistance:1.2,clearcoat:1,clearcoatRoughness:.02})}}function yt(x){const t={ring:()=>new Ie(.95,.36,64,160),ball:a=>()=>new Ne(a,64,48),pill:(a,r)=>()=>new ut(a,r,16,40),box:a=>()=>new ht(a,a,a,8,a*.2),knot:()=>new ct(.42,.14,220,28),hoop:()=>new Ie(.56,.06,24,140),cone:()=>new lt(.42,.95,64,1)};return x==="contact"?[[t.ring,"red",[.2,.12,0],1.25,[1.3,.1,.2]],[t.ball(.6),"white",[2.4,.5,.6],.6,[0,0,0]],[t.box(.8),"glass",[-2,1.4,-.8],.7,[.5,.6,.2]],[t.ball(.34),"chrome",[-.9,1.7,1],.34,[0,0,0]],[t.pill(.2,.6),"deep",[1.6,1.9,-1.3],.5,[.4,0,1.1]]]:[[t.ring,"red",[1.5,.12,-.3],1.25,[1.28,.2,.3]],[t.ball(.72),"white",[3.6,.55,.75],.72,[0,0,0]],[t.pill(.28,1.2),"chrome",[.6,.75,1.6],.78,[.3,.4,1.2]],[t.ball(.36),"red",[-.2,1.5,-.6],.36,[0,0,0]],[t.box(.95),"glass",[2.9,2.1,-1.6],.8,[.6,.5,.2]],[t.knot,"white",[-.7,1.9,-2.6],.75,[.4,.2,0]],[t.pill(.22,.62),"red",[4.9,.28,-.9],.55,[1.4,.3,.2]],[t.hoop,"chrome",[.95,2.4,.4],.6,[1.1,.3,0]],[t.ball(.48),"chrome",[5.4,1.5,.9],.48,[0,0,0]],[t.ball(.22),"deep",[2.4,1,2],.22,[0,0,0]]]}function bt(x,{preset:t="home",bg:a="#fbfbf9",onHover:r}={}){const v=matchMedia("(prefers-reduced-motion: reduce)").matches,l=matchMedia("(hover: none)").matches;let f;try{f=new ot({canvas:x,antialias:!0,alpha:!1,powerPreference:"high-performance"})}catch{return x.classList.add("is-fallback"),null}const y=Math.min(window.devicePixelRatio||1,l?1.5:1.75);f.setPixelRatio(y),f.toneMapping=at,f.toneMappingExposure=1;const n=new J(a);f.setClearColor(n,1);const w=new Ce;w.background=n;const b=new nt(f);w.environment=b.fromScene(new dt,.04).texture,w.environmentIntensity=1;const D=new st(16777215,1.6);D.position.set(-4,8,5),w.add(D),w.add(new rt(16777215,15914967,.5));const i=new qe(34,1,.1,100),S=new pt(f,l?224:320),d=new de(new Oe(X,X),{shader:vt,textureWidth:512,textureHeight:512,clipBias:.003,multisample:0});d.rotation.x=-Math.PI/2,w.add(d);const R=d.material.uniforms;R.uBg.value.copy(n),R.uTexel.value.set(1/S.size,1/S.size);const p=gt(),h=yt(t).map(([o,s,u,m,T],e)=>{const M=new F(o(),p[s]);M.rotation.set(...T),w.add(M);const z=new g(...u);return{mesh:M,r:m,home:z,pos:z.clone().add(new g(0,6+e*.6,0)),vel:new g,ang:new g((Math.random()-.5)*.6,(Math.random()-.5)*.6,0),phase:Math.random()*Math.PI*2,bob:.06+Math.random()*.08,bobS:.7+Math.random()*.6,wasAbove:!0}}),j=new Ne(1,24,16),G=[],O=t==="contact"?8:16;for(let o=0;o<O;o++){const s=new F(j,o%3?p.red:p.deep),u=.05+Math.random()*.1;s.scale.setScalar(u);const m=(Math.random()-.4)*16,T=(Math.random()-.65)*9;s.position.set(m,u*.3,T),w.add(s),G.push({m:s,s:u,x:m,z:T,ph:Math.random()*6.28,sp:.8+Math.random()})}let P=1,I=1,C=!1;const U=new g,Q=new g,_=new g,k=new g;let B=0;function re(){const o=x.getBoundingClientRect();P=Math.max(1,o.width),I=Math.max(1,o.height),f.setSize(P,I,!1),i.aspect=P/I,C=P/I<.9,i.fov=C?50:34,i.updateProjectionMatrix(),B=t==="contact"?C?0:3.4:C?-1.6:0,t==="contact"?(U.set(C?0:1.2,C?6:4.6,C?11.5:10),Q.set(C?0:1.6,.5,0),_.set(0,9,6),k.set(0,0,0)):(U.set(C?0:-.2,C?4.6:3.4,C?13:11.6),Q.set(C?0:.15,C?1.2:.75,0),_.set(1.2+B,10,4.5),k.set(1.2+B,0,-.5));const s=l?.6:.85,u=Math.round(P*y*s),m=Math.round(I*y*s);d.getRenderTarget().setSize(u,m)}re();const ie=new ResizeObserver(re);ie.observe(x);const W=new E(9,9),he=new E(9,9),fe=new E,De=new E,L=new it;let ee=!1,le=null,N=null;const me=new Ee,$=new g,pe=new g,c=new g,H=new g;function Pe(o){const s=x.getBoundingClientRect();W.set((o.clientX-s.left)/s.width*2-1,-((o.clientY-s.top)/s.height)*2+1),De.set(W.x,W.y)}function ve(o){const s=L.ray.origin,u=L.ray.direction;if(u.y>-1e-4)return!1;const m=-s.y/u.y;return o.copy(s).addScaledVector(u,m),!0}function Ue(){let o=null,s=1/0;for(const u of h){const m=c.copy(u.pos).sub(L.ray.origin).dot(L.ray.direction);m<0||(L.ray.at(m,H),H.distanceTo(u.pos)<u.r*1.05&&m<s&&(o=u,s=m))}return o}const te=(o,s)=>[o/X+.5,s/X+.5];function He(o){if(Pe(o),ee=!0,L.setFromCamera(W,i),N){L.ray.intersectPlane(me,$)&&$.add(pe);return}const s=Ue();s!==le&&(le=s,r==null||r(s?"grab":"water"))}function Xe(o){var u;Pe(o),L.setFromCamera(W,i);const s=!l&&Ue();if(s){N=s,i.getWorldDirection(c),me.setFromNormalAndCoplanarPoint(c.negate(),s.pos),L.ray.intersectPlane(me,$),pe.copy(s.pos).sub($),$.add(pe),(u=x.setPointerCapture)==null||u.call(x,o.pointerId),r==null||r("grabbing");return}ve(c)&&xe(c.x,c.z,1)}function Te(o){var s;N&&((s=x.releasePointerCapture)==null||s.call(x,o.pointerId),N=null,r==null||r(le?"grab":"water"))}function $e(){ee=!1,le=null,W.set(9,9),r==null||r(null)}x.addEventListener("pointermove",He),x.addEventListener("pointerdown",Xe),window.addEventListener("pointerup",Te),x.addEventListener("pointerleave",$e);function xe(o,s,u=1){const[m,T]=te(o,s);S.drop(m,T,.05*Math.sqrt(u),-.9*u),S.drop(m,T,.02,.5*u);for(const e of h){const M=Math.hypot(e.pos.x-o,e.pos.z-s);if(M<3.2){const z=(1-M/3.2)*5*u;e.vel.y+=z,e.vel.x+=(e.pos.x-o)/(M+.1)*z*.35,e.vel.z+=(e.pos.z-s)/(M+.1)*z*.35,e.ang.x+=(Math.random()-.5)*z,e.ang.z+=(Math.random()-.5)*z}}}let K=0,ge=!0,ye=0,we=performance.now(),be=0,Me=0;const ce=new g,Fe=R.uShadows.value;function Ke(o){const m=1+K*.5;for(const e of h)if(c.copy(e.home),c.x=(c.x-1.4)*m+1.4+B,c.z*=m,c.y+=Math.sin(be*e.bobS+e.phase)*e.bob+K*1.2,e===N?(c.copy($),c.y=Math.max(c.y,-e.r*.3),e.vel.lerp(H.copy(c).sub(e.pos).multiplyScalar(14),.5)):(e.vel.addScaledVector(c.sub(e.pos),7*o),e.pos.y>e.home.y+.5&&(e.vel.y-=9*o),e.vel.multiplyScalar(Math.max(0,1-2.4*o))),ee&&!N){const M=c.copy(e.pos).sub(L.ray.origin).dot(L.ray.direction);L.ray.at(M,H);const z=H.distanceTo(e.pos),A=e.r+.9;if(z<A){const q=Math.min(W.distanceTo(he)*40,3);c.copy(e.pos).sub(H).normalize().multiplyScalar((1-z/A)*(6+q*10)*o),e.vel.add(c),e.ang.x+=c.z*2,e.ang.z-=c.x*2}}for(let e=0;e<h.length;e++)for(let M=e+1;M<h.length;M++){const z=h[e],A=h[M];c.copy(A.pos).sub(z.pos);const q=c.length(),oe=(z.r+A.r)*.92;if(q>0&&q<oe){c.multiplyScalar(1/q);const ue=(oe-q)*.5;z.pos.addScaledVector(c,-ue),A.pos.addScaledVector(c,ue);const Y=H.copy(A.vel).sub(z.vel).dot(c);Y<0&&(z.vel.addScaledVector(c,Y*.8),A.vel.addScaledVector(c,-Y*.8))}}let T=0;for(const e of h){e.pos.addScaledVector(e.vel,o);const M=e.mesh;M.position.copy(e.pos),M.rotation.x+=(e.ang.x*.5+.05)*o,M.rotation.y+=(e.ang.y*.5+.12)*o,M.rotation.z+=e.ang.z*.5*o,e.ang.multiplyScalar(Math.max(0,1-1.2*o));const[z,A]=te(e.pos.x,e.pos.z),q=e.r-Math.abs(e.pos.y);if(q>0){const ue=Math.hypot(e.vel.x,e.vel.z),Y=(-e.vel.y*.012+ue*.006)*Math.min(1,q/e.r+.3);Math.abs(Y)>5e-4&&S.drop(z,A,e.r/X*.9,-Y)}const oe=e.pos.y>e.r*.4;e.wasAbove&&!oe&&e.vel.y<-2&&S.drop(z,A,e.r/X*2.2,Math.max(-1.4,e.vel.y*.12)),e.wasAbove=oe,T<se&&Fe[T++].set(e.pos.x,e.pos.z,e.r*1.1,e.pos.y-e.r*.2)}for(const e of G){const M=Math.sin(be*e.sp+e.ph)*e.s*.35+e.s*.2;if(e.m.position.set(e.x+B,M,e.z),Math.random()<.02){const[z,A]=te(e.x+B,e.z);S.drop(z,A,.008,-.04)}T<se&&Fe[T++].set(e.x+B,e.z,e.s*1.6,0)}R.uCount.value=T}function We(o){ye=requestAnimationFrame(We);const s=Math.min((o-we)/1e3,1/30);if(we=o,!ge)return;if(be+=s,L.setFromCamera(W,i),ee&&!N){const m=W.distanceTo(he);if(m>.002&&ve(c)){const[T,e]=te(c.x,c.z);S.drop(T,e,.016,-Math.min(m*3.2,.16))}}if(Me-=s,Me<0){Me=l||!ee?.9+Math.random()*1.2:2.5+Math.random()*3;const m=(Math.random()-.35)*10+B,T=(Math.random()-.6)*6,[e,M]=te(m,T);S.drop(e,M,.012+Math.random()*.012,-.18-Math.random()*.2)}Ke(s),he.copy(W),S.step(v?1:2),R.tHeight.value=S.texture,fe.lerp(De,.05);const u=K*K*(3-2*K);i.position.lerpVectors(U,_,u),i.position.x+=fe.x*(C?.3:.7)*(1-u),i.position.y+=fe.y*.35*(1-u),ce.lerpVectors(Q,k,u),i.lookAt(ce),R.uCam.value.copy(i.position),R.uFocus.value.set(ce.x,ce.z),R.uFade.value.set(C?4:5.5,C?10:13),f.render(w,i)}ye=requestAnimationFrame(We);const ke=new IntersectionObserver(([o])=>{ge=o.isIntersecting&&!document.hidden},{threshold:0});ke.observe(x);const Le=()=>{ge=!document.hidden,we=performance.now()};return document.addEventListener("visibilitychange",Le),{setScroll(o){K=Math.min(1,Math.max(0,o))},splash(o=1.4,s=0,u=1.2){xe(o+B,s,u)},splashScreen(o,s,u=1){const m=x.getBoundingClientRect();W.set((o-m.left)/m.width*2-1,-((s-m.top)/m.height)*2+1),L.setFromCamera(W,i),ve(c)&&xe(c.x,c.z,u),W.set(9,9)},dispose(){cancelAnimationFrame(ye),ie.disconnect(),ke.disconnect(),document.removeEventListener("visibilitychange",Le),window.removeEventListener("pointerup",Te),S.dispose(),f.dispose()}}}export{bt as c};
