import { useEffect } from 'react'
import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'
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

let isDatadogLogsInitialized = false
let isDatadogRumInitialized = false

const shouldEnableDatadog = IS_PRODUCTION || DATADOG_FORCE_ENABLE
const isDatadogLogsEnabled = shouldEnableDatadog && Boolean(DATADOG_CLIENT_TOKEN)
const isDatadogRumEnabled =
  shouldEnableDatadog && Boolean(DATADOG_RUM_APPLICATION_ID) && Boolean(DATADOG_RUM_CLIENT_TOKEN)

function initDatadogLogs() {
  if (isDatadogLogsInitialized || !isDatadogLogsEnabled) {
    return
  }

  datadogLogs.init({
    clientToken: DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.eu',
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  })

  isDatadogLogsInitialized = true
}

function initDatadogRum() {
  if (isDatadogRumInitialized || !isDatadogRumEnabled) {
    return
  }

  datadogRum.init({
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

  isDatadogRumInitialized = true
}

export function useDatadog() {
  useEffect(() => {
    initDatadogLogs()
    initDatadogRum()
  }, [])
}

export const logger = datadogLogs.logger

export function datadogCaptureException(error: Error, componentStack?: string) {
  if (!isDatadogRumEnabled || !isDatadogRumInitialized) {
    return
  }

  datadogRum.addError(error, {
    componentStack,
  })
}
