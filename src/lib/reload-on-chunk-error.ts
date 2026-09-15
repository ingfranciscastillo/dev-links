// After a new deploy, a tab left open (or a stale cached index.html) still
// references old hashed chunk filenames Vercel no longer serves — a lazy
// route import 404s with "Failed to fetch dynamically imported module".
// Vite's own docs recommend listening for this and reloading once:
// https://vite.dev/guide/build.html#load-error-handling
export const reloadOnChunkErrorScript = `
(function(){try{
  var k='devlinks-chunk-reload';
  window.addEventListener('vite:preloadError', function(){
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, '1');
    window.location.reload();
  });
  window.addEventListener('load', function(){ sessionStorage.removeItem(k); });
}catch(e){}})();
`.trim();
