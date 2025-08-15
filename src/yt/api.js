window.App = window.App || {};
App.YT = (function(){
  const A = ()=> App.YTAuth.token();

  async function fetchPublicVideo(ytId){
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: ytId
    });
    const r = await fetch(url, { headers: { Authorization: 'Bearer '+A() }});
    const j = await r.json();
    const v = j.items?.[0]; if (!v) throw new Error('Video no encontrado');
    const s = v.statistics||{}, sn=v.snippet||{}, cd=v.contentDetails||{};
    return {
      title: sn.title, publishedAt: sn.publishedAt,
      durationISO: cd.duration, // parsea a segundos si quieres
      views: +s.viewCount||0, likes: +s.likeCount||0, comments: +s.commentCount||0
    };
  }

  async function fetchAnalyticsVideo(ytId, startDate, endDate){
    const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
    url.search = new URLSearchParams({
      ids: 'channel==MINE',
      startDate, endDate,
      filters: `video==${ytId}`,
      dimensions: 'video',
      metrics: [
        'views','averageViewDuration','averageViewPercentage',
        'likes','dislikes','comments','subscribersGained'
      ].join(',')
    });
    const r = await fetch(url, { headers: { Authorization: 'Bearer '+A() }});
    if (!r.ok) throw new Error('Analytics '+r.status);
    const j = await r.json();
    const row = j.rows?.[0] || [];
    const m = {};
    ['views','avgDur','avgPct','likes','dislikes','comments','subsGained']
      .forEach((k,i)=> m[k]= +row[i]||0);
    return {
      views: m.views,
      averageViewDurationSec: m.avgDur,
      averageViewPercentage: m.avgPct,
      likes: m.likes, dislikes: m.dislikes, comments: m.comments, subsGained: m.subsGained
    };
  }

  return { fetchPublicVideo, fetchAnalyticsVideo };
})();
