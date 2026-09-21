// One worker handles both Workbox precaching/offline and Firebase Cloud
// Messaging on purpose: a separate firebase-messaging-sw.js would race this
// worker (vite-plugin-pwa #777) and fight over scope.
//
// Be careful what you import here — every import inflates the worker bundle.

/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache } from 'workbox-precaching'
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

import { getMessaging, isSupported, onBackgroundMessage } from 'firebase/messaging/sw'
import type { MessagePayload } from 'firebase/messaging/sw'

import { initializeFirebaseApp } from '@/services/push-notifications/firebase'
import {
  shouldShowServiceWorkerPushNotification,
  parseServiceWorkerPushNotification,
} from '@/service-workers/firebase-messaging/notifications'
import { cacheServiceWorkerPushNotificationTrackingEvent } from '@/services/push-notifications/tracking'

declare const self: ServiceWorkerGlobalScope & {
  // Injected by vite-plugin-pwa at build time.
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>
}
// Inlined by vite.config.ts `define`.
declare const __APP_VERSION__: string

const OFFLINE_URL = 'offline.html'
const SAFE_LOGO_ICON = '/images/safe-logo-green.png'

// self.__WB_MANIFEST is the injection point vite-plugin-pwa requires.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Serve the precached index.html shell for SPA routes; the denylist keeps
// worker/asset URLs from being answered with HTML.
const navigationRoute = new NavigationRoute(createHandlerBoundToURL('index.html'), {
  denylist: [
    /^\/sw\.js$/,
    /^\/workbox-/,
    /^\/firebase-messaging-sw\.js$/,
    /^\/manifest/,
    // any path with a file extension is an asset, not a route
    /\/[^/?]+\.[^/]+$/,
  ],
})
registerRoute(navigationRoute)

registerRoute(
  ({ request }) => ['image', 'font', 'style', 'script'].includes(request.destination),
  new CacheFirst({
    // Versioned so a new release starts a fresh cache; cleanupOutdatedCaches reclaims the old ones.
    cacheName: `static-${__APP_VERSION__}`,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 60 * 60 * 24 * 365,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const offline = await matchPrecache(OFFLINE_URL)
    if (offline) {
      return offline
    }
  }
  return Response.error()
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

type NotificationData = MessagePayload['data'] & { link: string }

// Registered synchronously so it attaches before Firebase's own
// notificationclick handler — ours must run first.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data as NotificationData | undefined
  if (!data?.link) {
    return
  }
  cacheServiceWorkerPushNotificationTrackingEvent('opened', data)
  event.waitUntil(self.clients.openWindow(data.link))
})

void isSupported()
  .then((supported) => {
    if (!supported) {
      return
    }

    const app = initializeFirebaseApp()
    if (!app) {
      return
    }

    const messaging = getMessaging(app)

    onBackgroundMessage(messaging, async (payload) => {
      if (!(await shouldShowServiceWorkerPushNotification(payload))) {
        return
      }

      const notification = await parseServiceWorkerPushNotification(payload)
      if (!notification) {
        return
      }

      const data: NotificationData = {
        ...payload.data,
        link: notification.link ?? self.location.origin,
      }

      cacheServiceWorkerPushNotificationTrackingEvent('shown', data)

      await self.registration.showNotification(notification.title || '', {
        icon: SAFE_LOGO_ICON,
        body: notification.body,
        data,
      })
    })
  })
  .catch(() => {
    // FCM unsupported here — precaching/offline still work.
  })
