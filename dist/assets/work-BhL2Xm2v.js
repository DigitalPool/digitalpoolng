import{$ as s,a as r,g as o,c as d,b as g}from"./app-DxOJy0wU.js";import{a as f,h}from"./hover-Diamn_iW.js";import{f as v,p as l}from"./data--UV_KWhM.js";const c=t=>String(t).padStart(2,"0");s("#count").textContent=c(l.length);s("#filters").innerHTML=v.map((t,e)=>{const a=t.id==="all"?l.length:l.filter(i=>i.filter===t.id).length;return a?`<button class="chip${e?"":" is-active"}" type="button" role="tab" aria-selected="${!e}" data-f="${t.id}">${t.label}<sup>${a}</sup></button>`:""}).join("");s("#grid").innerHTML=l.map((t,e)=>`
  <a class="card" href="/case?p=${t.slug}" data-filter="${t.filter}" data-cursor="View">
    <div class="card__media" data-tilt>
      <img src="${t.cover}" alt="${t.title}" loading="${e<2?"eager":"lazy"}" />
      <video muted loop playsinline preload="none" src="${t.preview}"></video>
    </div>
    <div class="card__info">
      <div><h2 class="card__title">${t.title}</h2><p class="card__kind">${t.kind} · ${t.client}</p></div>
      <span class="card__num mono">${c(e+1)}</span>
    </div>
  </a>`).join("");s("#list").innerHTML=l.map((t,e)=>`
  <a class="wl__row" href="/case?p=${t.slug}" data-filter="${t.filter}" data-preview="${t.preview}" data-cover="${t.cover}" data-cursor="View">
    <span class="wl__thumb"><img src="${t.cover}" alt="" loading="lazy" /></span>
    <span class="wl__idx mono">${c(e+1)}</span>
    <span class="wl__title">${t.title}</span>
    <span class="wl__kind">${t.kind}<br /><span class="mono" style="color:var(--muted)">${t.client}</span></span>
    <span class="wl__go" aria-hidden="true">→</span>
  </a>`).join("");f(r(".card"));h(s("#list"));r(".card").forEach((t,e)=>{o.from(t,{y:120,autoAlpha:0,duration:1.4,ease:"expo.out",scrollTrigger:{trigger:t,start:"top 95%",once:!0}});const a=t.querySelector("[data-tilt]");t.addEventListener("pointermove",i=>{const n=a.getBoundingClientRect(),p=(i.clientX-n.left)/n.width-.5,u=(i.clientY-n.top)/n.height-.5;o.to(a,{rotateY:p*6,rotateX:-u*6,transformPerspective:900,duration:.8,ease:"power3.out"})}),t.addEventListener("pointerleave",()=>o.to(a,{rotateY:0,rotateX:0,duration:1.2,ease:"elastic.out(1, 0.4)"}))});function m(t){r("#filters .chip").forEach(a=>{const i=a.dataset.f===t;a.classList.toggle("is-active",i),a.setAttribute("aria-selected",i)});const e=r(".card, #list .wl__row");o.to(e,{autoAlpha:0,y:30,duration:.3,ease:"power2.in",onComplete:()=>{e.forEach(a=>a.classList.toggle("is-out",t!=="all"&&a.dataset.filter!==t)),e.forEach(a=>{a.style.display=a.classList.contains("is-out")?"none":""}),d.refresh(),o.fromTo(e.filter(a=>!a.classList.contains("is-out")),{autoAlpha:0,y:40},{autoAlpha:1,y:0,duration:.9,stagger:.06,ease:"expo.out"})}})}s("#filters").addEventListener("click",t=>{const e=t.target.closest("[data-f]");e&&m(e.dataset.f)});r("[data-view]").forEach(t=>t.addEventListener("click",()=>{const e=t.dataset.view==="list";r("[data-view]").forEach(a=>a.classList.toggle("is-active",a===t)),s("#grid").hidden=e,s("#list").hidden=!e,d.refresh(),o.fromTo(e?"#list .wl__row":".card",{y:40,autoAlpha:0},{y:0,autoAlpha:1,stagger:.05,duration:.9,ease:"expo.out"})}));g({page:"work"});
