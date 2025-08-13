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
import { MixPanelEventParams } from './mixpanel-events'
import { GA_TO_MIXPANEL_MAPPING, ENABLED_MIXPANEL_EVENTS } from './ga-mixpanel-mapping'

const convertGAToMixpanelProperties = (
  eventData: AnalyticsEvent,
  additionalParameters?: Record<string, any>,
): Record<string, any> => {
  const baseProperties: Record<string, any> = {
    category: eventData.category,
    action: eventData.action,
  }

  if (eventData.label !== undefined) {
    baseProperties.label = eventData.label
  }

  if (eventData.chainId) {
    baseProperties[MixPanelEventParams.BLOCKCHAIN_NETWORK] = eventData.chainId
  }

  return {
    ...baseProperties,
    ...additionalParameters,
  }
}

export const trackEvent = (eventData: AnalyticsEvent, additionalParameters?: Record<string, any>): void => {
  gtmTrack(eventData)

  const mixpanelEventName =
    GA_TO_MIXPANEL_MAPPING[eventData.action] || (eventData.event ? GA_TO_MIXPANEL_MAPPING[eventData.event] : undefined)

  if (mixpanelEventName && ENABLED_MIXPANEL_EVENTS.includes(mixpanelEventName as any)) {
    const mixpanelProperties = convertGAToMixpanelProperties(eventData, additionalParameters)
    mixpanelTrack(mixpanelEventName, mixpanelProperties)
  }
}

export const trackSafeAppEvent = (
  eventData: AnalyticsEvent,
  safeApp?: any,
  options?: { launchLocation?: string; sdkEventData?: any },
): void => {
  const appName = safeApp?.name
  gtmTrackSafeApp(eventData, appName, options?.sdkEventData)

  const mixpanelEventName =
    GA_TO_MIXPANEL_MAPPING[eventData.action] || (eventData.event ? GA_TO_MIXPANEL_MAPPING[eventData.event] : undefined)

  if (mixpanelEventName && ENABLED_MIXPANEL_EVENTS.includes(mixpanelEventName as any) && safeApp) {
    const mixpanelProperties = safeAppToMixPanelEventProperties(safeApp, options)
    mixpanelTrack(mixpanelEventName, mixpanelProperties)
  }
}

export const trackMixPanelEvent = mixpanelTrack
export { safeAppToMixPanelEventProperties }

export const trackMixPanelEvent = mixpanelTrack
export { safeAppToMixPanelEventProperties }

export * from './types'
export * from './events'
export * from './mixpanel-events'
