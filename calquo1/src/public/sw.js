const CACHE_NAME = 'calico-v1.0.5';
const STATIC_CACHE = 'calico-static-v1.0.5';
const DYNAMIC_CACHE = 'calico-dynamic-v1.0.5';

// Critical resources to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  // Add other critical static assets
];

// API endpoints that should be cached
const CACHE_API_PATTERNS = [
  /\/api\/stock/,
  /\/api\/orders/,
  /\/api\/suppliers/,
  /\/api\/profile/
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     (cacheName.startsWith('tex-app-') || 
                      cacheName.startsWith('calico-') || 
                      cacheName.startsWith('tex-app-static-') || 
                      cacheName.startsWith('tex-app-dynamic-') ||
                      cacheName.startsWith('calico-static-') ||
                      cacheName.startsWith('calico-dynamic-'));
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER CACHE FIREBASE API CALLS - Always go to network
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') || 
      url.pathname.includes('/firestore/') ||
      url.pathname.includes('/functions/')) {
    console.log('[SW] Bypassing cache for Firebase API:', url.pathname);
    // Let the request go directly to the network without any SW intervention
    return;
  }

  // Skip cross-origin requests (except Firebase which we handle above)
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(request)) {
      // Cache First strategy for static assets
      event.respondWith(cacheFirst(request));
    } else if (isAPIRequest(request)) {
      // Network First strategy for API requests
      event.respondWith(networkFirst(request));
    } else {
      // Stale While Revalidate for other requests
      event.respondWith(staleWhileRevalidate(request));
    }
  }
});

// Cache First strategy - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return caches.match('/offline.html') || new Response('Offline');
  }
}

// Network First strategy - good for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a meaningful offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This feature is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate strategy - good for regular content
async function staleWhileRevalidate(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const networkResponsePromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

    return cachedResponse || await networkResponsePromise;
  } catch (error) {
    console.error('[SW] Stale While Revalidate failed:', error);
    return caches.match(request) || new Response('Offline');
  }
}

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return CACHE_API_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.pathname.startsWith('/api/');
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'tex-app-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  try {
    // Implement offline action synchronization here
    // This could include pending orders, stock updates, etc.
    console.log('[SW] Syncing offline actions...');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Tex-App',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ],
      requireInteraction: true,
      tag: data.tag || 'tex-app-notification'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Tex-App', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Simplified message handling
let messageIdCounter = 0;

self.addEventListener('message', (event) => {
  try {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
      return;
    }
    
    if (event.data && event.data.type === 'CLEAR_PENDING_MESSAGES') {
      console.log('[SW] Clearing pending messages');
      pendingMessages.clear();
      return;
    }
    
    // Simplified getPage message handling
    if (event.data && event.data.type === 'getPage') {
      const messageId = event.data.id || ++messageIdCounter;
      console.log(`[SW] Handling getPage message ${messageId}`);
      
      // Immediate response to prevent timeout
      try {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            success: true,
            messageId: messageId,
            data: event.data.data || {}
          });
        }
      } catch (error) {
        console.error(`[SW] Error responding to getPage ${messageId}:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Error handling message:', error);
  }
});

console.log('[SW] Service worker script loaded successfully');