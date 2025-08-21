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
import { mixpanelTrack, safeAppToMixPanelEventProperties } from './mixpanel'
import { GA_TO_MIXPANEL_MAPPING } from './ga-mixpanel-mapping'

export const trackEvent = (eventData: AnalyticsEvent, additionalParameters?: Record<string, any>): void => {
  gtmTrack(eventData)

  const mixpanelEventName =
    GA_TO_MIXPANEL_MAPPING[eventData.action] || (eventData.event ? GA_TO_MIXPANEL_MAPPING[eventData.event] : undefined)

  if (mixpanelEventName) {
    mixpanelTrack(mixpanelEventName, additionalParameters)
  }
}

export const trackSafeAppEvent = gtmTrackSafeApp

export const trackMixPanelEvent = mixpanelTrack
export { safeAppToMixPanelEventProperties }

export * from './types'
export * from './events'
export * from './mixpanel-events'
