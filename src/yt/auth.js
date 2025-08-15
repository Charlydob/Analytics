window.App = window.App || {};
App.YTAuth = (function(){
  const SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
  ].join(' ');
  let client, accessToken = null;

  function init({ clientId }){
    return new Promise((resolve)=>{
      function ready(){
        client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (t)=>{ accessToken = t.access_token; resolve(accessToken); }
        });
        resolve();
      }
      if (window.google?.accounts?.oauth2) ready();
      else window.addEventListener('load', ready);
    });
  }
  function getToken(prompt='consent'){
    return new Promise((resolve, reject)=>{
      if (!client) return reject('YTAuth no inicializado');
      client.callback = (t)=>{ accessToken = t.access_token; resolve(accessToken); };
      client.requestAccessToken({ prompt });
    });
  }
  function token(){ return accessToken; }
  return { init, getToken, token };
})();
