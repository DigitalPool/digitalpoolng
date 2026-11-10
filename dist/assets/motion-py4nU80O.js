import{$ as e,a as n,g as p,o as i,b as l}from"./app-DxOJy0wU.js";import{a as d}from"./hover-Diamn_iW.js";import{m as r,r as s}from"./data--UV_KWhM.js";e("#mCount").textContent=String(r.length).padStart(2,"0");e("#mgrid").innerHTML=r.map((t,a)=>`
  <button class="mcard" type="button" data-m="${a}" data-cursor="Play">
    <img src="${t.poster}" alt="${t.title}" loading="${a<4?"eager":"lazy"}" />
    <video muted loop playsinline preload="none" src="${t.loop}"></video>
    <span class="mcard__meta"><span><b>${t.title}</b><span>${t.line}</span></span><span class="mono">${String(a+1).padStart(2,"0")}</span></span>
  </button>`).join("");d(n(".mcard"));n(".mcard").forEach(t=>p.from(t,{y:80,autoAlpha:0,scale:.96,duration:1.2,ease:"expo.out",scrollTrigger:{trigger:t,start:"top 96%",once:!0}}));e("#mgrid").addEventListener("click",t=>{const a=t.target.closest("[data-m]");a&&i(r.map(o=>({type:"video",src:o.full,poster:o.poster,caption:`${o.title} · ${o.line}`})),+a.dataset.m)});e("#playReel").addEventListener("click",()=>i([{type:"video",src:s.src,poster:s.poster,caption:"DigitalPool showreel"}]));l({page:"motion"});
