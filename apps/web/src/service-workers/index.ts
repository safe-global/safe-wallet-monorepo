/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope

// Cache version - bump this to invalidate all caches on next deploy
const CACHE_VERSION = 'v1'

const CACHE_NAMES = {
  fonts: `fonts-${CACHE_VERSION}`,
  staticAssets: `static-assets-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
}

// Clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => !Object.values(CACHE_NAMES).includes(name)).map((name) => caches.delete(name)),
      )
    }),
  )
})

// Take control immediately
self.skipWaiting()
clientsClaim()

// NO precaching - only runtime caching for same-origin static assets
// Only cache successful (200) responses to avoid caching error pages

// Cache fonts (1 year - fonts rarely change)
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && /\.(woff2?|ttf|eot)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: CACHE_NAMES.fonts,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
)

// Cache _next/static assets (JS, CSS) - content-hashed, safe to cache long-term
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
  new CacheFirst({
    cacheName: CACHE_NAMES.staticAssets,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }), // 30 days
    ],
  }),
)

// Cache same-origin images (excluding SVG to avoid potential XSS from cached SVGs)
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && /\.(png|jpg|jpeg|gif|webp|ico)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }), // 30 days
    ],
  }),
)

// All other requests (including cross-origin API calls) fall through to network
