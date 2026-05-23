// HelloPepo Service Worker v1.0
const CACHE = 'helloPepo-v1';
const OFFLINE_ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache=>{
      return cache.addAll(OFFLINE_ASSETS).catch(()=>{});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e=>{
  // Skip non-GET and chrome-extension requests
  if(e.request.method !== 'GET') return;
  if(e.request.url.startsWith('chrome-extension')) return;

  // Supabase API — network only, no cache
  if(e.request.url.includes('supabase.co')){
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response=>{
        // Cache successful responses
        if(response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE).then(cache=>cache.put(e.request, clone));
        }
        return response;
      })
      .catch(()=>{
        // Offline fallback — return cached version
        return caches.match(e.request).then(cached=>{
          if(cached) return cached;
          // For navigation requests, return index.html
          if(e.request.mode === 'navigate'){
            return caches.match('/index.html');
          }
        });
      })
  );
});
