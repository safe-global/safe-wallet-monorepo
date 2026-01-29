// Be careful what you import here as it will increase the service worker bundle size

import { AppRoutes } from '@/config/routes' // Has no internal imports
import { FIREBASE_IS_PRODUCTION } from '@/services/push-notifications/firebase'
import { Notifications } from './notification-mapper'
import { getChainsConfig, setBaseUrl } from './gateway-utils'
import type { WebhookEvent } from './webhook-types'

const GATEWAY_URL_PRODUCTION = process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
const GATEWAY_URL_STAGING = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'

// localStorage cannot be accessed in service workers so we reference the flag from the environment
const GATEWAY_URL = FIREBASE_IS_PRODUCTION ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

// Set base URL for direct fetch calls (service workers can't use Redux store)
setBaseUrl(GATEWAY_URL)

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
  const notification = await Notifications[data.type](data as any, chain as any)

  if (notification) {
    return {
      ...notification,
      link: getLink(data, chain?.shortName),
    }
  }
}
