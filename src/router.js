window.App = window.App || {};
App.Views = App.Views || {};

App.Router = (function () {
  const { setActiveTab } = App.UI;

  const routes = {
    "/": App.Views.home,
    "/videos": App.Views.videos,
    "/video": App.Views.videoDetail, // #/video?id=...
    "/experiments": App.Views.experiments,
    "/settings": App.Views.settings
  };

  function parse() {
    const hash = location.hash || "#/";
    const [rawPath, qs = ""] = hash.slice(1).split("?");
    const path = ("/" + rawPath).replace(/\/+$/, ""); // quita barra final
    const params = Object.fromEntries(new URLSearchParams(qs));
    return { path, params };
  }

  function go() {
    const { path, params } = parse();
    const view = routes[path] || App.Views.home || (() => {});
    setActiveTab("#" + path);
    try {
      view(params);
    } catch (e) {
      console.error("View error:", e);
      const el = document.getElementById("view");
      if (el) el.innerHTML = `<section class="card small">Error cargando vista.</section>`;
    }
  }

  function navigate(path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    location.hash = "#" + path + (qs ? "?" + qs : "");
    setTimeout(go, 0); // fuerza render inmediato
  }

  function init() {
    // Delegación de clicks en tabs (evita depender del comportamiento del <a>)
    document.getElementById("navTabs")?.addEventListener("click", (e) => {
      const a = e.target.closest('a[data-route]');
      if (!a) return;
      e.preventDefault();
      const href = a.getAttribute("href"); // p.ej. "#/videos"
      navigate(href.slice(1));            // "/videos"
    });

    window.addEventListener("hashchange", go);
    if (!location.hash) navigate("/"); else go();
  }

  return { init, go, navigate };
})();
