import type { ILogger, IObservabilityProvider } from '../types'
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

interface DatadogLogsModule {
  datadogLogs: {
    init: (config: {
      clientToken: string
      site?: DatadogSite
      forwardErrorsToLogs?: boolean
      sessionSampleRate?: number
    }) => void
    logger: {
      info: (message: string, context?: Record<string, unknown>) => void
      warn: (message: string, context?: Record<string, unknown>) => void
      error: (message: string, context?: Record<string, unknown>) => void
      debug: (message: string, context?: Record<string, unknown>) => void
    }
  }
}

interface DatadogRumModule {
  datadogRum: {
    init: (config: {
      applicationId: string
      clientToken: string
      site?: DatadogSite
      service?: string
      env?: string
      version?: string
      sessionSampleRate?: number
      sessionReplaySampleRate?: number
      trackUserInteractions?: boolean
      trackResources?: boolean
      trackLongTasks?: boolean
      defaultPrivacyLevel?: 'mask' | 'mask-user-input' | 'allow'
      traceSampleRate?: number
      allowedTracingUrls?: Array<{
        match: string
        propagatorTypes: ('tracecontext' | 'datadog' | 'b3' | 'b3multi')[]
      }>
    }) => void
    addError: (error: Error, context?: Record<string, unknown>) => void
    setGlobalContextProperty: (key: string, value: unknown) => void
  }
}

let datadogLogsModule: DatadogLogsModule | null = null
let datadogRumModule: DatadogRumModule | null = null

const shouldEnableDatadog = IS_PRODUCTION || DATADOG_FORCE_ENABLE
const isDatadogLogsEnabled = shouldEnableDatadog && Boolean(DATADOG_CLIENT_TOKEN)
const isDatadogRumEnabled =
  shouldEnableDatadog && Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN)

export class DatadogProvider implements IObservabilityProvider {
  readonly name = 'Datadog'
  private isLogsInitialized = false
  private isRumInitialized = false

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
      try {
        await this.initLogs()
      } catch (error) {
        console.warn('Failed to initialize Datadog Logs:', error)
      }
    }

    if (hasRumToInit) {
      try {
        await this.initRum()
      } catch (error) {
        console.warn('Failed to initialize Datadog RUM:', error)
      }
    }
  }

  private async initLogs(): Promise<void> {
    if (!datadogLogsModule) {
      try {
        datadogLogsModule = await import('@datadog/browser-logs')
      } catch (error) {
        console.warn('Failed to load Datadog Logs module:', error)
        return
      }
    }

    if (!datadogLogsModule) {
      return
    }

    try {
      datadogLogsModule.datadogLogs.init({
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

  private async initRum(): Promise<void> {
    if (!datadogRumModule) {
      try {
        const rumModule = await import('@datadog/browser-rum')
        datadogRumModule = rumModule as unknown as DatadogRumModule
      } catch (error) {
        console.warn('Failed to load Datadog RUM module:', error)
        return
      }
    }

    if (!datadogRumModule) {
      return
    }

    try {
      datadogRumModule.datadogRum.init({
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

      // Set global context for proper faceting in Datadog UI
      datadogRumModule.datadogRum.setGlobalContextProperty('env', DATADOG_RUM_ENV)
      datadogRumModule.datadogRum.setGlobalContextProperty('service', DATADOG_RUM_SERVICE)
      datadogRumModule.datadogRum.setGlobalContextProperty('version', COMMIT_HASH)

      this.isRumInitialized = true
    } catch (error) {
      console.warn('Failed to initialize Datadog RUM (might be already initialized):', error)
    }
  }

  getLogger(): ILogger {
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized && datadogLogsModule) {
          datadogLogsModule.datadogLogs.logger.info(message, context)
        }
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized && datadogLogsModule) {
          datadogLogsModule.datadogLogs.logger.warn(message, context)
        }
      },
      error: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized && datadogLogsModule) {
          datadogLogsModule.datadogLogs.logger.error(message, context)
        }
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        if (this.isLogsInitialized && datadogLogsModule) {
          datadogLogsModule.datadogLogs.logger.debug(message, context)
        }
      },
    }
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    if (this.isRumInitialized && datadogRumModule) {
      datadogRumModule.datadogRum.addError(error, context)
    }
  }
}
