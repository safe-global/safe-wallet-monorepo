// Be careful what you import here as it will increase the service worker bundle size

/// <reference lib="webworker" />

import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import type { MessagePayload } from 'firebase/messaging/sw'

import { initializeFirebaseApp } from '@/services/push-notifications/firebase'
import {
  shouldShowServiceWorkerPushNotification,
  parseServiceWorkerPushNotification,
} from '@/service-workers/firebase-messaging/notifications'
import { cacheServiceWorkerPushNotificationTrackingEvent } from '@/services/push-notifications/tracking'

declare const self: ServiceWorkerGlobalScope

type NotificationData = MessagePayload['data'] & {
  link: string
}

export function firebaseMessagingSw() {
  const ICON_PATH = '/images/safe-logo-green.png'

  const app = initializeFirebaseApp()

  if (!app) {
    return
  }

  // Must be called before `onBackgroundMessage` as Firebase embeds a `notificationclick` listener
  self.addEventListener(
    'notificationclick',
    (event) => {
      event.notification.close()

      const data: NotificationData = event.notification.data

      cacheServiceWorkerPushNotificationTrackingEvent('opened', data)

      self.clients.openWindow(data.link)
    },
    false,
  )

  const messaging = getMessaging(app)

  onBackgroundMessage(messaging, async (payload) => {
    const shouldShow = await shouldShowServiceWorkerPushNotification(payload)

    if (!shouldShow) {
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

    self.registration.showNotification(notification.title || '', {
      icon: ICON_PATH,
      body: notification.body,
      data,
    })
  })
}
