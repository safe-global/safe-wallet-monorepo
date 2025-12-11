import type { ILogger, IObservabilityProvider } from '../types'
import { SENTRY_DSN } from '@/config/constants'
import packageJson from '../../../../package.json'

interface SentryModule {
  init: (config: any) => void
  captureException: (error: Error, context?: any) => void
  captureMessage: (message: string, context?: any) => void
  ErrorBoundary: any
}

let sentryModule: SentryModule | null = null

const isSentryEnabled = Boolean(SENTRY_DSN)

export class SentryProvider implements IObservabilityProvider {
  readonly name = 'Sentry'
  private isInitialized = false

  async init(): Promise<void> {
    if (!isSentryEnabled || this.isInitialized) {
      return
    }

    try {
      sentryModule = await import('@sentry/react')

      sentryModule.init({
        dsn: SENTRY_DSN,
        release: `safe-wallet-web@${packageJson.version}`,
        sampleRate: 0.1,
        ignoreErrors: [
          'Internal JSON-RPC error',
          'JsonRpcEngine',
          'Non-Error promise rejection captured with keys: code',
        ],
        beforeSend: (event: any) => {
          const query = event.request?.query_string
          if (event.request && query) {
            const appUrl = typeof query !== 'string' && !Array.isArray(query) ? query.appUrl : ''
            if (appUrl) {
              event.request.query_string = { appUrl }
            } else {
              delete event.request.query_string
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

  getErrorBoundary() {
    if (this.isInitialized && sentryModule) {
      return sentryModule.ErrorBoundary
    }
    return undefined
  }
}
