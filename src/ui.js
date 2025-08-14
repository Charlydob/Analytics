export const $ = sel => document.querySelector(sel);
export const $$ = sel => [...document.querySelectorAll(sel)];

export const toast = (msg, ms=2200)=>{
  const el = $("#toast"); el.textContent = msg; el.style.display='block';
  clearTimeout(el._t); el._t = setTimeout(()=> el.style.display='none', ms);
};

export const setActiveTab = (hash)=>{
  $$("#navTabs a").forEach(a=>a.classList.toggle("active", a.getAttribute("href")===hash));
};
