// Be careful what you import here as it will increase the service worker bundle size

import { get as getFromIndexedDb } from 'idb-keyval'
import { getChainsConfig } from '@safe-global/safe-gateway-typescript-sdk'
import type { MessagePayload } from 'firebase/messaging'

import { AppRoutes } from '@/config/routes' // Has no internal imports
import { isWebhookEvent } from './webhook-types'
import {
  getPushNotificationPrefsKey,
  createPushNotificationPrefsIndexedDb,
} from '@/services/push-notifications/preferences'
import { FIREBASE_IS_PRODUCTION } from '@/services/push-notifications/firebase'
import { Notifications } from './notification-mapper'
import type { WebhookEvent } from './webhook-types'
import type { PushNotificationPreferences, PushNotificationPrefsKey } from '@/services/push-notifications/preferences'

const GATEWAY_URL_PRODUCTION = process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
const GATEWAY_URL_STAGING = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'

// localStorage cannot be accessed in service workers so we reference the flag from the environment
const GATEWAY_URL = FIREBASE_IS_PRODUCTION ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

// setBaseUrl(GATEWAY_URL)

export const shouldShowServiceWorkerPushNotification = async (payload: MessagePayload): Promise<boolean> => {
  if (!isWebhookEvent(payload.data)) {
    return true
  }

  const { chainId, address, type } = payload.data

  const key = getPushNotificationPrefsKey(chainId, address)
  const store = createPushNotificationPrefsIndexedDb()

  const preferencesStore = await getFromIndexedDb<PushNotificationPreferences[PushNotificationPrefsKey]>(
    key,
    store,
  ).catch(() => null)

  if (!preferencesStore) {
    return false
  }

  return preferencesStore.preferences[type]
}

const getLink = (data: WebhookEvent, shortName?: string) => {
  const URL = self.location.origin

  if (!shortName) {
    return URL
  }

  const withRoute = (route: string) => {
    return `${URL}${route}?safe=${shortName}:${data.address}`
  }

  if ('safeTxHash' in data) {
    return `${withRoute(AppRoutes.transactions.tx)}&id=${data.safeTxHash}`
  }

  return withRoute(AppRoutes.transactions.history)
}

export const _parseServiceWorkerWebhookPushNotification = async (
  data: WebhookEvent,
): Promise<{ title: string; body: string; link: string } | undefined> => {
  const chain = await getChainsConfig()
    .then(({ results }) => results.find((chain) => chain.chainId === data.chainId))
    .catch(() => undefined)

  // Can be safely casted as `data.type` is a mapped type of `NotificationsMap`
  const notification = await Notifications[data.type](data as any, chain)

  if (notification) {
    return {
      ...notification,
      link: getLink(data, chain?.shortName),
    }
  }
}

export const parseServiceWorkerPushNotification = async (
  payload: MessagePayload,
): Promise<({ title?: string; link?: string } & NotificationOptions) | undefined> => {
  // Manually dispatched notifications from the Firebase admin panel; displayed as is
  if (!isWebhookEvent(payload.data)) {
    return payload.notification
  }

  // Transaction Service-dispatched notification
  return _parseServiceWorkerWebhookPushNotification(payload.data)
}
