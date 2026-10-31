// 離線快取：第一次開過之後，沒網路也能玩。
const CACHE = "zp-v14";
const ASSETS = ["./", "./index.html", "./css/style.css", "./manifest.webmanifest", "./icons/icon.svg",
  "./js/app.js", "./js/core/ui.js", "./js/core/router.js", "./js/core/audio.js", "./js/core/voice_map.js", "./js/core/store.js", "./js/core/confetti.js", "./js/core/daily.js",
  "./js/subjects/zhuyin/index.js", "./js/subjects/zhuyin/data.js", "./js/subjects/zhuyin/animals.js", "./js/subjects/zhuyin/textbook.js", "./js/subjects/zhuyin/play.js",
  "./js/subjects/math/index.js", "./js/subjects/math/curriculum.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => hit)));
});
