// Service Worker for Safe Wallet Web - Vanilla implementation with Firebase messaging
// Handles caching and Firebase Cloud Messaging push notifications

// Import Firebase libraries for push notifications
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

const CACHE_VERSION = 'v1'
const CACHE_NAMES = {
  fonts: `fonts-${CACHE_VERSION}`,
  static: `static-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
}

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !Object.values(CACHE_NAMES).includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

// Take control immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Runtime caching for static assets only
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return
  }

  // Determine cache strategy based on URL pattern
  let cacheName
  if (/\.(woff2?|ttf|eot)$/i.test(url.pathname)) {
    cacheName = CACHE_NAMES.fonts
  } else if (url.pathname.startsWith('/_next/static/')) {
    cacheName = CACHE_NAMES.static
  } else if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
    cacheName = CACHE_NAMES.images
  } else {
    // Network-only for everything else (HTML, API calls, etc.)
    return
  }

  // CacheFirst strategy: check cache, fall back to network, cache successful responses
  event.respondWith(
    caches.open(cacheName).then((cache) =>
      cache.match(request).then((cached) => {
        if (cached) {
          return cached
        }

        return fetch(request).then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            cache.put(request, response.clone())
          }
          return response
        })
      }),
    ),
  )
})

// Firebase Cloud Messaging - Push Notifications
// Firebase config is dynamically set by the app via messaging.getToken()
// The SDK handles onBackgroundMessage internally once initialized
