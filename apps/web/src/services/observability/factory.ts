import type { IObservabilityProvider } from './types'
import { NoOpProvider } from './providers/noop'
import { DatadogProvider, isDatadogEnabled } from './providers/datadog'
import { SentryProvider } from './providers/sentry'
import { CompositeProvider } from './providers/composite'
import { SENTRY_DSN } from '@/config/constants'
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
