/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

// Take control immediately
self.skipWaiting()
clientsClaim()

// NO precaching - only runtime caching for same-origin static assets

// Cache fonts
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && /\.(woff2?|ttf|eot)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
)

// Cache _next/static assets (JS, CSS)
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_next/static/'),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
)

// Cache same-origin images
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

// All other requests (including cross-origin API calls) fall through to network
