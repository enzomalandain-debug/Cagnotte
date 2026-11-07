// La Cagnotte : permet d'ouvrir l'appli sans connexion (au ski, par exemple).
// Réseau d'abord pour toujours avoir la dernière version, sinon la copie gardée sur le téléphone.
const CACHE = 'la-cagnotte-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (sameOrigin && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((r) => r || (sameOrigin ? caches.match('./index.html') : undefined))
      )
  );
});
