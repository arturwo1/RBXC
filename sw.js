const CACHE_NAME = 'rbx-calculators-v7.02';

const ASSETS = [
  '/', '/SPTSC', '/SPTLC', '/Calculator', '/Help', '/404.html', '/assets/style.css', '/assets/app.js', '/images/rbxc_banner.png', '/images/rbxc_favicon.png', '/images/spts_favicon.png', '/images/spts_banner.png', '/images/sptl_favicon.png', '/images/sptl_banner.png', '/images/rbxc_icon_1024.png', '/images/rbxc_icon_512.png', '/images/rbxc_icon_72.png', '/images/pwa_screenshot_wide.png', '/images/pwa_screenshot_mobile.png', '/images/error-image.png', '/manifest.json'
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

    await Promise.all(ASSETS.map(async (url) => {
      try {
        const req = new Request(url, { mode: 'same-origin' });
        const resp = await fetch(req);

        if (resp && (resp.ok || resp.type === 'opaque')) {
          await cache.put(req, resp.clone());
          console.debug('[SW] Precached', url);
        } else {
          throw new Error('Response not ok and not opaque: ' + url + ' status:' + (resp && resp.status));
        }
      } catch (err) {
        console.warn('[SW] Precache failed', url, err && err.message ? err.message : err);
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
    console.debug('[SW] Activated, old caches cleared');
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
            await cache.put(req, networkResp.clone());
            console.debug('[SW] Updated cache', req.url);
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
          await cache.put(req, networkResp.clone());
        } catch (cErr) {
          console.warn('[SW] Cache put failed for', req.url, cErr);
        }
      }
      return networkResp;
    } catch (err) {
      const accept = req.headers.get('accept') || '';

      if (accept.includes('text/html')) {
        return (await caches.match('/index.html')) || (await caches.match('/404.html')) || new Response('<h1>Offline</h1>', {
          tatus: 503,
          headers: { 'Content-Type': 'text/html' }
        });
      }

      if (req.destination === 'image' || accept.includes('image')) {
        return (await caches.match('/images/error-image.png')) || new Response('', { status: 503 });
      }

      return new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  })());
});