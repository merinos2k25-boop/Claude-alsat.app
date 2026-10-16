/* Alış Satış Takip - çevrimdışı çalışma */
const V = 'as-takip-v6';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // Sayfa: önce ağ (güncel kalsın), olmazsa önbellek
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // Aynı site dosyaları ve Excel kütüphanesi: önbellek öncelikli, arkada yenile
  if (u.origin === location.origin || u.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
