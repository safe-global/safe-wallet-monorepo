import { createObservabilityProvider } from './factory'
import { CompositeProvider } from './providers/composite'
import type { ILogger, IObservabilityProvider, ObservedError } from './types'

let activeProvider: IObservabilityProvider = createObservabilityProvider()

/**
 * Initialize observability providers (Datadog RUM, Mixpanel tracing, etc.).
 * Must be called explicitly at app startup to enable error tracking and monitoring.
 *
 * When `providers` is supplied it fully replaces the default provider (built
 * from the Datadog/NoOp factory) and is fanned out through a CompositeProvider,
 * so the composition root can wire multiple sinks behind this single service.
 *
 * This function should be called once at the application entry point (_app.tsx)
 * before React rendering begins to capture early page metrics and errors.
 */
export const initObservability = (providers?: IObservabilityProvider[]): void => {
  if (typeof window === 'undefined') {
    return
  }

  if (providers?.length) {
    activeProvider = providers.length === 1 ? providers[0] : new CompositeProvider(providers)
  }

  Promise.resolve(activeProvider.init()).catch((error: Error) => {
    console.error('Failed to initialize observability provider:', error)
  })
}

/**
 * Stable logger that delegates to the active provider at call time. The active
 * provider is unknown until `initObservability` runs, so this cannot be bound to
 * a concrete logger at import time.
 */
export const logger: ILogger = {
  info: (...args) => activeProvider.getLogger().info(...args),
  warn: (...args) => activeProvider.getLogger().warn(...args),
  error: (...args) => activeProvider.getLogger().error(...args),
  debug: (...args) => activeProvider.getLogger().debug(...args),
}

export const captureError = (error: ObservedError): void => {
  activeProvider.captureError(error)
}
