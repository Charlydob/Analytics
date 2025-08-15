window.App = window.App || {};
App.YTUtil = (function(){
  function parseId(input){
    if (!input) return '';
    const s = String(input).trim();

    // ¿ya es un ID de 11 chars?
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

    // intenta como URL
    try{
      const u = new URL(s);
      // youtu.be/<id>
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace(/^\/+/,'').split('/')[0];
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
      // youtube.com/watch?v=<id>
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      // shorts / embed
      const parts = u.pathname.split('/').filter(Boolean);
      const iShorts = parts.indexOf('shorts');
      if (iShorts>=0 && /^[a-zA-Z0-9_-]{11}$/.test(parts[iShorts+1]||'')) return parts[iShorts+1];
      const iEmbed = parts.indexOf('embed');
      if (iEmbed>=0 && /^[a-zA-Z0-9_-]{11}$/.test(parts[iEmbed+1]||'')) return parts[iEmbed+1];
    }catch(e){ /* no era URL */ }

    // fallback patrón v=
    const m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];

    return '';
  }
  return { parseId };
})();
