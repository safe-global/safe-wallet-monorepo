// Be careful what you import here as it will increase the service worker bundle size

import { createStore as createIndexedDb, update as updateIndexedDb } from 'idb-keyval'
import type { MessagePayload } from 'firebase/messaging/sw'

import { isWebhookEvent, WebhookType } from '@/service-workers/firebase-messaging/webhook-types'

export type NotificationTrackingKey = `${string}:${WebhookType}`

export type NotificationTracking = {
  [chainKey: NotificationTrackingKey]: {
    shown: number
    opened: number
  }
}

export const getNotificationTrackingKey = (chainId: string, type: WebhookType): NotificationTrackingKey => {
  return `${chainId}:${type}`
}

export const parseNotificationTrackingKey = (key: string): { chainId: string; type: WebhookType } => {
  const [chainId, type] = key.split(':') as [string, WebhookType]

  if (!Object.values(WebhookType).includes(type)) {
    throw new Error(`Invalid notification tracking key: ${key}`)
  }

  return {
    chainId,
    type: type as WebhookType,
  }
}

export const createNotificationTrackingIndexedDb = () => {
  const DB_NAME = 'notifications-tracking-database'
  const STORE_NAME = 'notifications-tracking-store'

  return createIndexedDb(DB_NAME, STORE_NAME)
}

export const DEFAULT_WEBHOOK_TRACKING: NotificationTracking[NotificationTrackingKey] = {
  shown: 0,
  opened: 0,
}

export const cacheServiceWorkerPushNotificationTrackingEvent = (
  property: keyof NotificationTracking[NotificationTrackingKey],
  data: MessagePayload['data'],
) => {
  if (!isWebhookEvent(data)) {
    return
  }

  const key = getNotificationTrackingKey(data.chainId, data.type)
  const store = createNotificationTrackingIndexedDb()

  updateIndexedDb<NotificationTracking[NotificationTrackingKey] | undefined>(
    key,
    (notificationCount) => {
      if (notificationCount) {
        return {
          ...notificationCount,
          [property]: (notificationCount[property] ?? 0) + 1,
        }
      }

      return DEFAULT_WEBHOOK_TRACKING
    },
    store,
  ).catch(() => null)
}
