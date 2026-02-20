import type { ILogger, IObservabilityProvider } from '../types'
import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
import {
  COMMIT_HASH,
  DATADOG_CLIENT_TOKEN,
  DATADOG_FORCE_ENABLE,
  DATADOG_LOGS_SAMPLE_RATE,
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
  IS_PRODUCTION,
} from '@/config/constants'

type DatadogSite =
  | 'datadoghq.com'
  | 'datadoghq.eu'
  | 'us3.datadoghq.com'
  | 'us5.datadoghq.com'
  | 'ddog-gov.com'
  | 'ap1.datadoghq.com'

const shouldEnableDatadog = IS_PRODUCTION || DATADOG_FORCE_ENABLE
const isDatadogLogsEnabled = shouldEnableDatadog && Boolean(DATADOG_CLIENT_TOKEN)
const isDatadogRumEnabled =
  shouldEnableDatadog && Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN)

export class DatadogProvider implements IObservabilityProvider {
  readonly name = 'Datadog'
  private isLogsInitialized = false
  private isRumInitialized = false

  private setRumGlobalContext(): void {
    datadogRum.setGlobalContextProperty('env', DATADOG_RUM_ENV)
    datadogRum.setGlobalContextProperty('service', DATADOG_RUM_SERVICE)
    datadogRum.setGlobalContextProperty('version', COMMIT_HASH)
  }

  async init(): Promise<void> {
    const isClient = typeof window !== 'undefined'
    if (!isClient) {
      return
    }

    const hasLogsToInit = isDatadogLogsEnabled && !this.isLogsInitialized
    const hasRumToInit = isDatadogRumEnabled && !this.isRumInitialized

    if (!hasLogsToInit && !hasRumToInit) {
      return
    }

    if (hasLogsToInit) {
      this.initLogs()
    }

    if (hasRumToInit) {
      this.initRum()
    }
  }

  private initLogs(): void {
    try {
      datadogLogs.init({
        clientToken: DATADOG_CLIENT_TOKEN,
        site: DATADOG_RUM_SITE as DatadogSite,
        forwardErrorsToLogs: true,
        sessionSampleRate: DATADOG_LOGS_SAMPLE_RATE,
      })
      this.isLogsInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Datadog Logs (might be already initialized):', error)
    }
  }

  private initRum(): void {
    try {
      const getInitConfiguration = datadogRum.getInitConfiguration
      const isAlreadyInitialized = typeof getInitConfiguration === 'function' && Boolean(getInitConfiguration())
      if (isAlreadyInitialized) {
        this.isRumInitialized = true
        this.setRumGlobalContext()
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

      this.setRumGlobalContext()

      this.isRumInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Datadog RUM (might be already initialized):', error)
    }
  }

  getLogger(): ILogger {
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized) {
          datadogLogs.logger.info(message, context)
        }
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized) {
          datadogLogs.logger.warn(message, context)
        }
      },
      error: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized) {
          datadogLogs.logger.error(message, context)
        }
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized) {
          datadogLogs.logger.debug(message, context)
        }
      },
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (this.isRumInitialized) {
      datadogRum.addError(error, context)
    }
  }
}
