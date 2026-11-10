import{$ as o,s as m,t as c,a as f,b as $,r as v}from"./app-DxOJy0wU.js";import{s as g}from"./data--UV_KWhM.js";import{c as b}from"./pool-BWBfPQ75.js";import"./three.module-BliFmUBb.js";const i=o("#pool"),n=b(i,{preset:"contact",onHover:e=>m(e||"","")});i.addEventListener("pointerenter",()=>m("water"));o(".contact-hero").addEventListener("pointerdown",e=>{e.target===i||e.target.closest("a, button")||n==null||n.splashScreen(e.clientX,e.clientY,1)});o("#form").addEventListener("submit",e=>{var r;e.preventDefault();const t=e.target,a=t.name.value.trim(),s=t.email.value.trim();if(!a||!/^\S+@\S+\.\S+$/.test(s)){c("Add your name and a valid email"),(a?t.email:t.name).focus();return}const d=f('input[name="need"]:checked',t).map(p=>p.value).join(", ")||"Not specified",l=((r=o('input[name="budget"]:checked',t))==null?void 0:r.value)||"Not specified",u=`Hi DigitalPool,

Name: ${a}
Email: ${s}
Needs: ${d}
Budget: ${l}

${t.message.value.trim()}
`;location.href=`mailto:${g.email}?subject=${encodeURIComponent(`New project: ${a}`)}&body=${encodeURIComponent(u)}`,c("Opening your email app…")});$({page:"contact",onEnter(){v||setTimeout(()=>n==null?void 0:n.splash(.2,0,1.3),200)}});
