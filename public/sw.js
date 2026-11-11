// ==============================================================================
// PRIME NEWS GRAPH — Service Worker for Push Notifications & Background Sync
// ==============================================================================

const CACHE_NAME = 'png-cache-v1';
const OFFLINE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push Notification Listener
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'ব্রেকিং নিউজ - PRIME NEWS GRAPH', body: event.data.text() };
    }
  } else {
    data = {
      title: 'ব্রেকিং নিউজ - PRIME NEWS GRAPH',
      body: 'তাজা খবর পড়তে ক্লিক করুন।'
    };
  }

  const title = data.title || 'ব্রেকিং নিউজ - PRIME NEWS GRAPH';
  const options = {
    body: data.body || 'নতুন সংবাদ প্রকাশিত হয়েছে। বিস্তারিত জানতে ক্লিক করুন।',
    icon: data.icon || '/assets/images/news_world_summit_1793801922828.jpg',
    badge: data.badge || '/assets/images/news_world_summit_1793801922828.jpg',
    image: data.image || undefined,
    data: {
      url: data.url || '/'
    },
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || `news-${Date.now()}`,
    renotify: true,
    actions: [
      { action: 'read', title: 'পড়ুন (Read Story)' },
      { action: 'dismiss', title: 'বাদ দিন (Dismiss)' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler: Opens the specific news article
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Message handler from frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const payload = event.data.payload || {};
    self.registration.showNotification(payload.title || 'PRIME NEWS GRAPH', {
      body: payload.body || 'সবার আগে সর্বশেষ খবর পেতে আমাদের সাথেই থাকুন।',
      icon: payload.icon || '/assets/images/news_world_summit_1793801922828.jpg',
      image: payload.image || undefined,
      data: { url: payload.url || '/' },
      vibrate: [200, 100, 200],
      tag: payload.tag || `alert-${Date.now()}`,
      renotify: true
    });
  }
});
