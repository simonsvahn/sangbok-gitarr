/* Sångbok Gitarrs service worker — offlineläge.
   Strategi: cache-först med bakgrundsuppdatering (stale-while-revalidate).
   Sidan visas alltid direkt (även utan nät); med nät hämtas senaste bygget
   i bakgrunden och visas vid nästa appstart. */
const CACHE = "sangbok-gitarr-v1";
const FILER = ["./", "./index.html", "./gitarren.html", "./manifest.json", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILER.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(traff => {
      const fransNatet = fetch(e.request).then(svar => {
        if (svar && svar.ok) {
          const kopia = svar.clone();
          caches.open(CACHE).then(c => c.put(e.request, kopia));
        }
        return svar;
      }).catch(() => traff);
      return traff || fransNatet;
    })
  );
});
