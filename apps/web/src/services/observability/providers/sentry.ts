import type { ILogger, IObservabilityProvider } from '../types'
import * as Sentry from '@sentry/react'
import { SENTRY_DSN } from '@/config/constants'
import packageJson from '../../../../package.json'

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
      Sentry.init({
        dsn: SENTRY_DSN,
        release: `safe-wallet-web@${packageJson.version}`,
        sampleRate: 0.1,
        ignoreErrors: [
          'Internal JSON-RPC error',
          'JsonRpcEngine',
          'Non-Error promise rejection captured with keys: code',
        ],
        beforeSend: (event) => {
          const request = event.request
          const query = request?.query_string
          if (request && query) {
            const appUrl =
              typeof query !== 'string' && !Array.isArray(query) ? (query as Record<string, unknown>).appUrl : ''
            if (appUrl) {
              request.query_string = { appUrl: appUrl as string }
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
        if (this.isInitialized) {
          Sentry.captureMessage(message, {
            level: 'info',
            extra: context,
          })
        }
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          Sentry.captureMessage(message, {
            level: 'warning',
            extra: context,
          })
        }
      },
      error: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          Sentry.captureMessage(message, {
            level: 'error',
            extra: context,
          })
        }
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          Sentry.captureMessage(message, {
            level: 'debug',
            extra: context,
          })
        }
      },
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (this.isInitialized) {
      Sentry.captureException(error, {
        extra: context,
      })
    }
  }
}
