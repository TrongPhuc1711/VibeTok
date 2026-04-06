// ============================================================
// VibeTok Service Worker v1.0
// ============================================================

const CACHE_NAME = 'vibetok-v1';
const STATIC_CACHE = 'vibetok-static-v1';
const API_CACHE = 'vibetok-api-v1';

// Assets để cache khi cài app
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// API endpoints được cache (network first)
const API_CACHE_ROUTES = [
  '/api/videos/feed',
  '/api/hashtags/trending',
  '/api/users/suggestions',
  '/api/music',
  '/api/categories',
];

// ── Install: cache static assets ──
self.addEventListener('install', (event) => {
  console.log('[SW] Installing VibeTok Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating VibeTok Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: intercept requests ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua các request không phải GET
  if (request.method !== 'GET') return;

  // Bỏ qua chrome-extension và các protocol lạ
  if (!url.protocol.startsWith('http')) return;

  // API requests → Network First, fallback to cache
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 5000));
    return;
  }

  // Static assets → Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Navigation (HTML pages) → Network First với offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Còn lại → Network First
  event.respondWith(networkFirstStrategy(request, STATIC_CACHE, 3000));
});

// ── Strategies ──

// Cache First: lấy từ cache, nếu không có mới fetch mạng
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Không có kết nối mạng', { status: 503 });
  }
}

// Network First: fetch từ mạng, timeout thì fallback cache
async function networkFirstStrategy(request, cacheName, timeout = 3000) {
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeout)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Navigation strategy: network first, fallback to /index.html (SPA)
async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match('/index.html');
    return cached || new Response('App đang offline', { status: 503 });
  }
}

// ── Helpers ──
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
    url.hostname === 'vibetok.onrender.com';
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf|gif|webp)$/.test(url.pathname);
}

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'VibeTok', body: event.data.text() };
  }

  const options = {
    body: data.body || 'Bạn có thông báo mới',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'Xem ngay' },
      { action: 'close', title: 'Đóng' },
    ],
    tag: data.tag || 'vibetok-notif',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'VibeTok', options)
  );
});

// Khi user click vào notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu app đang mở → focus vào
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Nếu app chưa mở → mở tab mới
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Background Sync (gửi lại request khi có mạng) ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-likes') {
    event.waitUntil(syncPendingLikes());
  }
  if (event.tag === 'sync-comments') {
    event.waitUntil(syncPendingComments());
  }
});

async function syncPendingLikes() {
  // TODO: đọc từ IndexedDB và gửi lại API
  console.log('[SW] Syncing pending likes...');
}

async function syncPendingComments() {
  console.log('[SW] Syncing pending comments...');
}