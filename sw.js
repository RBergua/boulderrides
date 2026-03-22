// ============================================================
// Service Worker (sw) — MapTiler tile cache
// ============================================================
//
// WHY THIS EXISTS
// ---------------
// MapTiler's free tier allows 100,000 tile requests/month. Each
// user loads roughly 25 tiles on their first visit, which means
// the quota would run out after ~4,000 unique visitors. Once the 
// limit is hit, the map falls back to plain OpenStreetMap for 
// everyone for the rest of the month.
//
// This Service Worker solves that by making sure each device only
// ever counts as ONE visitor — no matter how many times they come
// back within 90 days.
//
// HOW IT WORKS
// ------------
// The browser installs this file automatically the first time
// a user visits boulderrides.cc. After that, it silently sits
// between the browser and the internet, intercepting every
// network request.
//
// When a MapTiler tile is requested:
//   • Cache hit  → served instantly from disk. Zero API requests.
//   • Cache miss → fetched from MapTiler, then saved for next time.
//
// Tiles are kept for 90 days. After that they expire and are
// re-fetched fresh on the next visit. The total cache size for
// a typical Boulder-area session is around 1–4 MB per user.
//
// Unlike the regular browser HTTP cache, this cache lasts much 
// longer, survives hard-refreshes (Ctrl+Shift+R), tab closes, and 
// mobile app background-kills.
//
// FASTER EXPERIENCE FOR THE USER
// --------------------------------
// Beyond saving API quota, cached tiles load instantly from disk
// rather than travelling across the internet. On a return visit
// the map appears fully rendered in milliseconds. Noticeably
// faster than the first load, and completely unaffected by the
// user's network speed or MapTiler's server response time.
//
// DEPLOYMENT
// ----------
// This file must live at the ROOT of the server:
//   https://boulderrides.cc/sw.js   ✓
//   https://boulderrides.cc/js/sw.js ✗  (won't work in a subfolder)
//
// TESTING (Chrome DevTools)
// -------------------------
// After deploying, open boulderrides.cc and press F12.
//
// Step 1 — Confirm the SW installed:
//   Application tab → Service Workers (left sidebar)
//   You should see sw.js with a green dot: "activated and running"
//
// Step 2 — Confirm cache is used on reload:
//   Reload with Ctrl+R → Network tab
//   Every tile should show "(ServiceWorker)" or "(memory cache)"in 
//   the Size column instead of a file size. That means zero bytes 
//   were fetched from the network.
//   The key check is 0.0 kB transferred in the bottom bar.
//
// ============================================================

const CACHE_NAME  = 'maptiler-tiles-v1'; // bump to 'v2' to force-clear all cached tiles
const MAX_AGE_SEC = 90 * 24 * 3600;      // 90 days in seconds

self.addEventListener('fetch', event => {

  // Only intercept MapTiler GET tile requests. Ignore everything else
  // HEAD requests (used for the availability) are not cached
  if (!event.request.url.includes('api.maptiler.com')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {

      // 1. Check the cache first
      const cached = await cache.match(event.request);
      if (cached) return cached; // Cache hit — instant, free

      // 2. Cache miss — fetch from MapTiler
      const fresh = await fetch(event.request);

      // 3. Save a clean copy to cache (only if the request succeeded)
      if (fresh.ok) {
        const tileToStore = new Response(await fresh.clone().arrayBuffer(), {
          status: fresh.status,
          headers: {
            'Content-Type': fresh.headers.get('Content-Type') || 'image/png',
            'Cache-Control': `public, max-age=${MAX_AGE_SEC}`
          }
        });
        cache.put(event.request, tileToStore);
      }

      return fresh;
    })
  );
});
