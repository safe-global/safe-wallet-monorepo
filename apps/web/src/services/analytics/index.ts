/**
 * The analytics service.
 *
 * Exports `trackEvent` and event types.
 * `trackEvent` is supposed to be called by UI components.
 *
 * The event definitions are in the `events` folder.
 *
 * Usage example:
 *
 * `import { trackEvent, ADDRESS_BOOK_EVENTS } from '@/services/analytics'`
 * `trackEvent(ADDRESS_BOOK_EVENTS.EXPORT)`
 */
import type { AnalyticsEvent } from './types'
import { gtmTrack, gtmTrackSafeApp } from './gtm'
// Moved from deleted mixpanel.ts for backward compatibility
const safeAppToMixPanelEventProperties = (safeApp: any, options?: { launchLocation?: string }) => {
  const properties: Record<string, any> = {}

  if (safeApp?.name) {
    properties['Safe App Name'] = safeApp.name
  }

  if (safeApp?.tags && Array.isArray(safeApp.tags)) {
    properties['Safe App Tags'] = safeApp.tags
  }

  if (options?.launchLocation) {
    // Convert enum-like values to readable strings
    const locationMap: Record<string, string> = {
      PREVIEW_DRAWER: 'Preview Drawer',
      SAFE_APPS_LIST: 'Safe Apps List',
      apps_list: 'Safe Apps List',
      apps_sidebar: 'Preview Drawer',
    }
    properties['Launch Location'] = locationMap[options.launchLocation] || options.launchLocation
  }

  return properties
}

export const trackEvent = (eventData: AnalyticsEvent, additionalParameters?: Record<string, any>): void => {
  gtmTrack(eventData)
  // Note: Mixpanel tracking removed - use new analytics system instead
  // additionalParameters kept for backward compatibility but not used
  void additionalParameters
}

export const trackSafeAppEvent = (
  eventData: AnalyticsEvent,
  safeApp?: any,
  options?: { launchLocation?: string; sdkEventData?: any },
): void => {
  const appName = safeApp?.name
  gtmTrackSafeApp(eventData, appName, options?.sdkEventData)
  // Note: Mixpanel tracking removed - use new analytics system instead
}

// Deprecated: Use new analytics system instead
export const trackMixPanelEvent = () => {
  console.warn('trackMixPanelEvent is deprecated. Use analytics.track() from analytics instead.')
}
export { safeAppToMixPanelEventProperties }

// Export the new analytics system as the primary interface
export { analytics, safeAnalytics, analyticsDevTools, useAnalytics } from './unified-analytics'

export * from './types'
export * from './events'
export * from './mixpanel-events' // Still needed for safeAppToMixPanelEventProperties compatibility
