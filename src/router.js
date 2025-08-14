import { renderHome } from './views/home.js';
import { renderVideos } from './views/videos.js';
import { renderVideoDetail } from './views/videoDetail.js';
import { renderExperiments } from './views/experiments.js';
import { renderSettings } from './views/settings.js';
import { setActiveTab } from './ui.js';

const routes = {
  '/': renderHome,
  '/videos': renderVideos,
  '/video': renderVideoDetail, // expects #/video?id=...
  '/experiments': renderExperiments,
  '/settings': renderSettings
};

export function initRouter(){
  const go = ()=>{
    const hash = location.hash || '#/';
    const [path, qs] = hash.slice(1).split('?');
    const params = Object.fromEntries(new URLSearchParams(qs||''));
    const view = routes['/'+path] || renderHome;
    setActiveTab('#/'+path);
    view(params);
  };
  addEventListener('hashchange', go);
  go();
}
