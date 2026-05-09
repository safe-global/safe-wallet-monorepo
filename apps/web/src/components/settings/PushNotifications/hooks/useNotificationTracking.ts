import { keys as keysFromIndexedDb, update as updateIndexedDb } from 'idb-keyval'
import { useEffect } from 'react'

import {
  DEFAULT_WEBHOOK_TRACKING,
  createNotificationTrackingIndexedDb,
  parseNotificationTrackingKey,
} from '@/services/push-notifications/tracking'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import type { NotificationTracking, NotificationTrackingKey } from '@/services/push-notifications/tracking'
import type { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

const trackNotificationEvents = (
  chainId: string,
  type: WebhookType,
  notificationCount: NotificationTracking[NotificationTrackingKey],
) => {
  // Shown notifications
  for (let i = 0; i < notificationCount.shown; i++) {
    trackEvent({
      ...PUSH_NOTIFICATION_EVENTS.SHOW_NOTIFICATION,
      label: type,
      chainId,
    })
  }

  // Opened notifications
  for (let i = 0; i < notificationCount.opened; i++) {
    trackEvent({
      ...PUSH_NOTIFICATION_EVENTS.OPEN_NOTIFICATION,
      label: type,
      chainId,
    })
  }
}

const handleTrackCachedNotificationEvents = async (
  trackingStore: ReturnType<typeof createNotificationTrackingIndexedDb>,
) => {
  try {
    // Get all tracked webhook events by chainId, e.g. "1:NEW_CONFIRMATION"
    const trackedNotificationKeys = await keysFromIndexedDb<NotificationTrackingKey>(trackingStore)

    // Get the number of notifications shown/opened and track then clear the cache
    const promises = trackedNotificationKeys.map((key) => {
      return updateIndexedDb<NotificationTracking[NotificationTrackingKey]>(
        key,
        (notificationCount) => {
          if (notificationCount) {
            const { chainId, type } = parseNotificationTrackingKey(key)
            trackNotificationEvents(chainId, type, notificationCount)
          }

          // Return the default cache with 0 shown/opened events
          return DEFAULT_WEBHOOK_TRACKING
        },
        trackingStore,
      )
    })

    await Promise.all(promises)
  } catch (e) {
    logError(ErrorCodes._401, e)
  }
}

export const useNotificationTracking = (): void => {
  const isNotificationFeatureEnabled = useHasFeature(FEATURES.PUSH_NOTIFICATIONS)

  useEffect(() => {
    if (typeof indexedDB !== 'undefined' && isNotificationFeatureEnabled) {
      handleTrackCachedNotificationEvents(createNotificationTrackingIndexedDb())
    }
  }, [isNotificationFeatureEnabled])
}
