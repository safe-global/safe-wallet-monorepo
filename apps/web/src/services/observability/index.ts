import { createObservabilityProvider } from './factory'
import type { ILogger } from './types'

const observabilityProvider = createObservabilityProvider()

// Initialize synchronously to ensure ErrorBoundary is available immediately
observabilityProvider.init()

export const logger: ILogger = observabilityProvider.getLogger()

export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  observabilityProvider.captureException(error, context)
}

export const getErrorBoundary = () => observabilityProvider.getErrorBoundary?.()
