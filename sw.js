const CACHE_NAME = 'zahav-v2';

// Files to cache
const urlsToCache = [
  'index.html',
  'manifest.json',
  'logo.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker installing for Zahav App...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating for Zahav App...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like the Google Apps Script API
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('google.com') ||
      event.request.url.includes('drive.google.com') ||
      event.request.url.includes('googleusercontent.com')) {
    // For API requests, go to network first, then cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For local assets, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Return cached response
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        // Try network
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            
            // Return offline fallback page if needed
            if (event.request.mode === 'navigate') {
              return caches.match('index.html');
            }
          });
      })
  );
});

// Handle background sync for offline actions (if needed)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-orders') {
    console.log('Syncing orders in background for Zahav App');
    // Implement background sync logic here if needed
  }
  if (event.tag === 'sync-catalog') {
    console.log('Syncing catalog in background for Zahav App');
    // Implement background sync logic here if needed
  }
});

// Handle push notifications (if needed)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Zahav App',
    icon: 'logo.png',
    badge: 'logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'view', title: 'View Dashboard' },
      { action: 'close', title: 'Close' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Zahav App Dashboard', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('index.html')
    );
  }
});
