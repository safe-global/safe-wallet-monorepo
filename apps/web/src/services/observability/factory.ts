import type { IObservabilityProvider } from './types'
import { NoOpProvider } from './providers/noop'
import { DatadogProvider, isDatadogEnabled } from './providers/datadog'

export const createObservabilityProvider = (): IObservabilityProvider => {
  if (isDatadogEnabled) {
    return new DatadogProvider()
  }

  return new NoOpProvider()
}
