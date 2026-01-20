import { createObservabilityProvider } from './factory'
import type { ILogger } from './types'

const observabilityProvider = createObservabilityProvider()

/**
 * Initialize observability providers (Datadog RUM, Sentry, etc.)
 * Must be called explicitly at app startup to enable error tracking and monitoring.
 *
 * This function should be called once at the application entry point (_app.tsx)
 * before React rendering begins to capture early page metrics and errors.
 */
export const initObservability = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  Promise.resolve(observabilityProvider.init()).catch((error: Error) => {
    console.error('Failed to initialize observability provider:', error)
  })
}

export const logger: ILogger = observabilityProvider.getLogger()

export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  observabilityProvider.captureException(error, context)
}
