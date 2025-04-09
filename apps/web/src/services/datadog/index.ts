import { DATADOG_CLIENT_TOKEN, IS_PRODUCTION } from '@/config/constants'
import { datadogLogs } from '@datadog/browser-logs'
import { useEffect } from 'react'

let isDatadogInitialized = false

function initDatadog() {
  if (isDatadogInitialized) {
    return
  }
  if (!DATADOG_CLIENT_TOKEN) {
    console.warn('Datadog client token is not set. Skipping Datadog initialization.')
    return
  }
  if (!IS_PRODUCTION) {
    console.warn('Datadog is not initialized in non-production environments. Skipping Datadog initialization.')
    return
  }

  datadogLogs.init({
    clientToken: DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.eu',
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
  })

  isDatadogInitialized = true
}

export function useDatadog() {
  useEffect(() => {
    initDatadog()
  }, [])
}

export const logger = datadogLogs.logger
