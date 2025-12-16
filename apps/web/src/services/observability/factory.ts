import type { IObservabilityProvider } from './types'
import { NoOpProvider } from './providers/noop'
import { DatadogProvider } from './providers/datadog'
import { SentryProvider } from './providers/sentry'
import { CompositeProvider } from './providers/composite'
import {
  SENTRY_DSN,
  DATADOG_CLIENT_TOKEN,
  DATADOG_RUM_APPLICATION_ID,
  DATADOG_RUM_CLIENT_TOKEN,
  DATADOG_FORCE_ENABLE,
  IS_PRODUCTION,
} from '@/config/constants'

const shouldEnableDatadog = IS_PRODUCTION || DATADOG_FORCE_ENABLE
const isDatadogEnabled =
  shouldEnableDatadog &&
  (Boolean(DATADOG_CLIENT_TOKEN) || (Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN)))
const isSentryEnabled = Boolean(SENTRY_DSN)

export const createObservabilityProvider = (): IObservabilityProvider => {
  const providers: IObservabilityProvider[] = []

  if (isSentryEnabled) {
    providers.push(new SentryProvider())
  }

  if (isDatadogEnabled) {
    providers.push(new DatadogProvider())
  }

  if (providers.length === 0) {
    return new NoOpProvider()
  }

  if (providers.length === 1) {
    return providers[0]
  }

  return new CompositeProvider(providers)
}
