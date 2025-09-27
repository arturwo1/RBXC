const CACHE_NAME = 'rbx-calculators-v6';

const ASSETS = [
  '/', '/SPTSC', '/SPTLC', '/Calculator', '/Help', '404.html', '/assets/style.css', '/assets/app.js', '/assets/error-image.png', '/assets/dark-bg.png', '/assets/light-bg.png', 'https://i.ibb.co/r2xfy5Vz/2025-08-16-151027523-1.png', 'https://i.ibb.co/FvSsvP8/image.png', 'https://i.ibb.co/fVwGHYd6/2025-08-16-144245432.png', 'https://i.ibb.co/V0JBsHdP/image.png', 'https://i.ibb.co/KS0m9JY/image.png', 'https://i.ibb.co/svG0dydt/image.png', 'https://i.ibb.co/RGVxzxwL/2025-06-20-132934582.png', 'https://i.ibb.co/tMX5G3VT/image.png', 'https://i.ibb.co/s96nvTS7/image.png'
];

const EXCLUDE_HOSTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'adsystem.com',
  'adservice.google.com'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(ASSETS.map(async (u) => {
      try {
        const parsed = new URL(u, self.location.origin);
        const mode = parsed.origin === location.origin ? 'same-origin' : 'no-cors';
        const req = new Request(u, { mode });
        const resp = await fetch(req);

        if (resp && (resp.ok || resp.type === 'opaque')) {
          await cache.put(u, resp.clone());
          console.debug('Precached', u);
        } else {
          throw new Error('Response not ok and not opaque: ' + u + ' status:' + (resp && resp.status));
        }
      } catch (err) {
        console.warn('Precache failed', u, err && err.message ? err.message : err);
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (EXCLUDE_HOSTS.some(host => url.hostname.includes(host))) {
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) {
      event.waitUntil((async () => {
        try {
          const networkResp = await fetch(req);
          if (networkResp && (networkResp.ok || networkResp.type === 'opaque')) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(req.url, networkResp.clone());
          }
        } catch (e) {

        }
      })());
      return cached;
    }

    try {
      const networkResp = await fetch(req);
      if (networkResp && (networkResp.ok || networkResp.type === 'opaque')) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req.url, networkResp.clone());
        } catch (cErr) {
          console.warn('Cache put failed for', req.url, cErr);
        }
      }
      return networkResp;
    } catch (err) {
      const accept = req.headers.get('accept') || '';

      if (accept.includes('text/html')) {
        return (await caches.match('/index.html')) ||
          (await caches.match('/404.html')) ||
          new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } });
      }

      if (req.destination === 'image' || accept.includes('image')) {
        return (await caches.match('/assets/error-image.png')) ||
          new Response('', { status: 503 });
      }

      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    }
  })());
});