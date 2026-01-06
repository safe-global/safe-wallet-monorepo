import type { ILogger, IObservabilityProvider } from '../types'
import {
  COMMIT_HASH,
  DATADOG_CLIENT_TOKEN,
  DATADOG_FORCE_ENABLE,
  DATADOG_LOGS_SAMPLE_RATE,
  DATADOG_RUM_APPLICATION_ID,
  DATADOG_RUM_CLIENT_TOKEN,
  DATADOG_RUM_ENV,
  DATADOG_RUM_SERVICE,
  DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
  DATADOG_RUM_SESSION_SAMPLE_RATE,
  DATADOG_RUM_SITE,
  DATADOG_RUM_TRACE_SAMPLE_RATE,
  DATADOG_RUM_TRACING_ENABLED,
  GATEWAY_URL_PRODUCTION,
  GATEWAY_URL_STAGING,
  IS_PRODUCTION,
} from '@/config/constants'

interface DatadogLogsConfig {
  clientToken: string
  site: string
  forwardErrorsToLogs: boolean
  sessionSampleRate: number
}

interface DatadogRumConfig {
  applicationId: string
  clientToken: string
  site: string
  service: string
  env: string
  version: string
  sessionSampleRate: number
  sessionReplaySampleRate: number
  trackUserInteractions: boolean
  trackResources: boolean
  trackLongTasks: boolean
  defaultPrivacyLevel: 'mask' | 'mask-user-input' | 'allow'
  traceSampleRate?: number
  allowedTracingUrls?: Array<{
    match: string
    propagatorTypes: ('tracecontext' | 'datadog' | 'b3' | 'b3multi')[]
  }>
}

interface DatadogLogsModule {
  datadogLogs: {
    init: (config: DatadogLogsConfig) => void
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
    init: (config: DatadogRumConfig) => void
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

    try {
      if (hasLogsToInit) {
        await this.initLogs()
      }

      if (hasRumToInit) {
        await this.initRum()
      }
    } catch (error) {
      console.warn('Failed to initialize Datadog:', error)
    }
  }

  private async initLogs(): Promise<void> {
    if (!datadogLogsModule) {
      datadogLogsModule = await import('@datadog/browser-logs')
    }

    try {
      datadogLogsModule.datadogLogs.init({
        clientToken: DATADOG_CLIENT_TOKEN,
        site: DATADOG_RUM_SITE,
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
      datadogRumModule = await import('@datadog/browser-rum')
    }

    if (!datadogRumModule) {
      return
    }

    try {
      datadogRumModule.datadogRum.init({
        applicationId: DATADOG_RUM_APPLICATION_ID,
        clientToken: DATADOG_RUM_CLIENT_TOKEN,
        site: DATADOG_RUM_SITE,
        service: DATADOG_RUM_SERVICE,
        env: DATADOG_RUM_ENV,
        version: COMMIT_HASH,
        sessionSampleRate: DATADOG_RUM_SESSION_SAMPLE_RATE,
        sessionReplaySampleRate: DATADOG_RUM_SESSION_REPLAY_SAMPLE_RATE,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask',
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
