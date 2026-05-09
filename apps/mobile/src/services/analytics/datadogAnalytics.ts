import { DdRum } from 'expo-datadog'

let previousViewKey: string | null = null

/**
 * Track screen views in Datadog RUM.
 * Automatically stops the previous view before starting a new one.
 */
export const trackDatadogView = (viewKey: string, viewName: string): void => {
  if (previousViewKey && previousViewKey !== viewKey) {
    DdRum.stopView(previousViewKey)
  }

  DdRum.startView(viewKey, viewName)
  previousViewKey = viewKey
}
