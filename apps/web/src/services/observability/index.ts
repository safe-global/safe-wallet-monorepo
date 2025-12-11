import { createObservabilityProvider } from './factory'
import type { ILogger } from './types'

const observabilityProvider = createObservabilityProvider()

// Initialize only on client-side (fire-and-forget pattern)
// This ensures ErrorBoundary is available as soon as possible
// while not blocking app startup
if (typeof window !== 'undefined') {
  const initPromise = observabilityProvider.init() as Promise<void> | void
  if (initPromise && typeof initPromise.catch === 'function') {
    initPromise.catch((error: Error) => {
      console.error('Failed to initialize observability provider:', error)
    })
  }
}

export const logger: ILogger = observabilityProvider.getLogger()

export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  observabilityProvider.captureException(error, context)
}

export const getErrorBoundary = () => observabilityProvider.getErrorBoundary?.()
