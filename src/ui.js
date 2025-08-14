window.App = window.App || {};
App.UI = (()=>{

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const toast = (msg, ms=2200)=>{
    const el = $("#toast"); if(!el) return;
    el.textContent = msg; el.style.display='block';
    clearTimeout(el._t); el._t = setTimeout(()=> el.style.display='none', ms);
  };

  const setActiveTab = (hash)=>{
    $$("#navTabs a").forEach(a=>a.classList.toggle("active", a.getAttribute("href")===hash));
  };

  return { $, $$, toast, setActiveTab };
})();
