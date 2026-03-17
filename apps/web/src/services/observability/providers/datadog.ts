import type { ILogger, IObservabilityProvider } from '../types'
import { datadogRum } from '@datadog/browser-rum'
import {
  COMMIT_HASH,
  DATADOG_RUM_APPLICATION_ID,
  DATADOG_RUM_CLIENT_TOKEN,
  DATADOG_RUM_DEFAULT_PRIVACY_LEVEL,
  DATADOG_RUM_ENV,
  DATADOG_RUM_SERVICE,
  DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
  DATADOG_RUM_SESSION_SAMPLE_RATE,
  DATADOG_RUM_SITE,
  DATADOG_RUM_TRACE_SAMPLE_RATE,
  DATADOG_RUM_TRACK_LONG_TASKS,
  DATADOG_RUM_TRACK_RESOURCES,
  DATADOG_RUM_TRACK_USER_INTERACTIONS,
  DATADOG_RUM_TRACING_ENABLED,
  GATEWAY_URL_PRODUCTION,
  GATEWAY_URL_STAGING,
} from '@/config/constants'

type DatadogSite =
  | 'datadoghq.com'
  | 'datadoghq.eu'
  | 'us3.datadoghq.com'
  | 'us5.datadoghq.com'
  | 'ddog-gov.com'
  | 'ap1.datadoghq.com'

export const isDatadogEnabled = Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN)

export class DatadogProvider implements IObservabilityProvider {
  readonly name = 'Datadog'
  private isInitialized = false

  async init(): Promise<void> {
    const isClient = typeof window !== 'undefined'
    if (!isClient || !isDatadogEnabled || this.isInitialized) {
      return
    }

    try {
      const getInitConfiguration = datadogRum.getInitConfiguration
      const isAlreadyInitialized = typeof getInitConfiguration === 'function' && Boolean(getInitConfiguration())
      if (isAlreadyInitialized) {
        this.isInitialized = true
        return
      }

      datadogRum.init({
        applicationId: DATADOG_RUM_APPLICATION_ID,
        clientToken: DATADOG_RUM_CLIENT_TOKEN,
        site: DATADOG_RUM_SITE as DatadogSite,
        service: DATADOG_RUM_SERVICE,
        env: DATADOG_RUM_ENV,
        version: COMMIT_HASH,
        sessionSampleRate: DATADOG_RUM_SESSION_SAMPLE_RATE,
        sessionReplaySampleRate: DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
        trackUserInteractions: DATADOG_RUM_TRACK_USER_INTERACTIONS,
        trackResources: DATADOG_RUM_TRACK_RESOURCES,
        trackLongTasks: DATADOG_RUM_TRACK_LONG_TASKS,
        defaultPrivacyLevel: DATADOG_RUM_DEFAULT_PRIVACY_LEVEL,
        ...(DATADOG_RUM_TRACING_ENABLED && {
          traceSampleRate: DATADOG_RUM_TRACE_SAMPLE_RATE,
          allowedTracingUrls: [
            { match: GATEWAY_URL_PRODUCTION, propagatorTypes: ['tracecontext', 'datadog'] },
            { match: GATEWAY_URL_STAGING, propagatorTypes: ['tracecontext', 'datadog'] },
          ],
        }),
      })

      this.isInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Datadog RUM (might be already initialized):', error)
    }
  }

  getLogger(): ILogger {
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addAction(message, { level: 'info', ...context })
        }
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addAction(message, { level: 'warn', ...context })
        }
      },
      error: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addError(new Error(message), context)
        }
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        if (this.isInitialized) {
          datadogRum.addAction(message, { level: 'debug', ...context })
        }
      },
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (this.isInitialized) {
      datadogRum.addError(error, context)
    }
  }
}
