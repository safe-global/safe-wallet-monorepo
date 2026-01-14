import { createObservabilityProvider } from './factory'
import type { ILogger } from './types'

const observabilityProvider = createObservabilityProvider()
const isClient = typeof window !== 'undefined'
const MAX_QUEUED_EXCEPTIONS = 25

type QueuedException = { error: Error; context?: Record<string, unknown> }
const queuedExceptions: QueuedException[] = []
let isInitialized = false
let initFailed = false

const flushQueuedExceptions = (): void => {
  if (queuedExceptions.length === 0) {
    return
  }

  const pending = queuedExceptions.splice(0)
  pending.forEach(({ error, context }) => {
    observabilityProvider.captureException(error, context)
  })
}

// Initialize only on client-side (fire-and-forget pattern)
// This ensures ErrorBoundary is available as soon as possible
// while not blocking app startup
if (isClient) {
  const initPromise = Promise.resolve(observabilityProvider.init())
  initPromise
    .then(() => {
      isInitialized = true
      flushQueuedExceptions()
    })
    .catch((error: Error) => {
      initFailed = true
      queuedExceptions.length = 0
      console.error('Failed to initialize observability provider:', error)
    })
}

export const logger: ILogger = observabilityProvider.getLogger()

export const captureException = (error: Error, context?: Record<string, unknown>): void => {
  if (!isClient) {
    observabilityProvider.captureException(error, context)
    return
  }

  if (!isInitialized && !initFailed) {
    if (queuedExceptions.length >= MAX_QUEUED_EXCEPTIONS) {
      queuedExceptions.shift()
    }
    queuedExceptions.push({ error, context })
    return
  }

  observabilityProvider.captureException(error, context)
}
