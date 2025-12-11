import type { ILogger, IObservabilityProvider } from '../types'
import {
  COMMIT_HASH,
  DATADOG_CLIENT_TOKEN,
  DATADOG_FORCE_ENABLE,
  DATADOG_RUM_APPLICATION_ID,
  DATADOG_RUM_CLIENT_TOKEN,
  DATADOG_RUM_ENV,
  DATADOG_RUM_SERVICE,
  DATADOG_RUM_SESSION_SAMPLE_RATE,
  DATADOG_RUM_SITE,
  DATADOG_RUM_TRACING_ENABLED,
  GATEWAY_URL_PRODUCTION,
  GATEWAY_URL_STAGING,
  IS_PRODUCTION,
} from '@/config/constants'

interface DatadogLogsModule {
  datadogLogs: {
    init: (config: any) => void
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
    init: (config: any) => void
    addError: (error: Error, context?: Record<string, unknown>) => void
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
    try {
      if (isDatadogLogsEnabled && !this.isLogsInitialized) {
        await this.initLogs()
      }

      if (isDatadogRumEnabled && !this.isRumInitialized) {
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

    datadogLogsModule.datadogLogs.init({
      clientToken: DATADOG_CLIENT_TOKEN,
      site: DATADOG_RUM_SITE,
      forwardErrorsToLogs: true,
      sessionSampleRate: 100,
    })

    this.isLogsInitialized = true
  }

  private async initRum(): Promise<void> {
    if (!datadogRumModule) {
      datadogRumModule = await import('@datadog/browser-rum')
    }

    datadogRumModule.datadogRum.init({
      applicationId: DATADOG_RUM_APPLICATION_ID,
      clientToken: DATADOG_RUM_CLIENT_TOKEN,
      site: DATADOG_RUM_SITE,
      service: DATADOG_RUM_SERVICE,
      env: DATADOG_RUM_ENV,
      version: COMMIT_HASH,
      sessionSampleRate: DATADOG_RUM_SESSION_SAMPLE_RATE,
      sessionReplaySampleRate: 0,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: 'mask',
      ...(DATADOG_RUM_TRACING_ENABLED && {
        allowedTracingUrls: [
          { match: GATEWAY_URL_PRODUCTION, propagatorTypes: ['tracecontext', 'datadog'] },
          { match: GATEWAY_URL_STAGING, propagatorTypes: ['tracecontext', 'datadog'] },
        ],
      }),
    })

    this.isRumInitialized = true
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
