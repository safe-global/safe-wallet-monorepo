import type { ILogger, IObservabilityProvider } from '../types'
import { SENTRY_DSN } from '@/config/constants'
import packageJson from '../../../../package.json'

interface SentryModule {
  init: (config: Record<string, unknown>) => void
  captureException: (error: Error, context?: Record<string, unknown>) => void
  captureMessage: (message: string, context?: Record<string, unknown>) => void
}

let sentryModule: SentryModule | null = null

const isSentryEnabled = Boolean(SENTRY_DSN)

export class SentryProvider implements IObservabilityProvider {
  readonly name = 'Sentry'
  private isInitialized = false

  async init(): Promise<void> {
    const isClient = typeof window !== 'undefined'
    if (!isClient || !isSentryEnabled || this.isInitialized) {
      return
    }

    try {
      sentryModule = await import('@sentry/react')

      if (!sentryModule) {
        return
      }

      sentryModule.init({
        dsn: SENTRY_DSN,
        release: `safe-wallet-web@${packageJson.version}`,
        sampleRate: 0.1,
        ignoreErrors: [
          'Internal JSON-RPC error',
          'JsonRpcEngine',
          'Non-Error promise rejection captured with keys: code',
        ],
        beforeSend: (event: Record<string, unknown>) => {
          const request = event.request as Record<string, unknown> | undefined
          const query = request?.query_string
          if (request && query) {
            const appUrl =
              typeof query !== 'string' && !Array.isArray(query) ? (query as Record<string, unknown>).appUrl : ''
            if (appUrl) {
              request.query_string = { appUrl }
            } else {
              delete request.query_string
            }
          }
          return event
        },
      })

      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error)
    }
  }

  getLogger(): ILogger {
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized && sentryModule) {
          sentryModule.captureMessage(message, {
            level: 'info',
            extra: context,
          })
        }
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized && sentryModule) {
          sentryModule.captureMessage(message, {
            level: 'warning',
            extra: context,
          })
        }
      },
      error: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized && sentryModule) {
          sentryModule.captureMessage(message, {
            level: 'error',
            extra: context,
          })
        }
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized && sentryModule) {
          sentryModule.captureMessage(message, {
            level: 'debug',
            extra: context,
          })
        }
      },
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (this.isInitialized && sentryModule) {
      sentryModule.captureException(error, {
        extra: context,
      })
    }
  }
}
