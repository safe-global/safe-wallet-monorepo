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
import { mixpanelTrack } from './mixpanel'
import { GA_TO_MIXPANEL_MAPPING } from './ga-mixpanel-mapping'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { MixpanelEventParams } from './mixpanel-events'

export const trackEvent = (eventData: AnalyticsEvent, additionalParameters?: Record<string, any>): void => {
  gtmTrack(eventData)

  const mixpanelEventName =
    GA_TO_MIXPANEL_MAPPING[eventData.action] || (eventData.event ? GA_TO_MIXPANEL_MAPPING[eventData.event] : undefined)

  if (mixpanelEventName) {
    mixpanelTrack(mixpanelEventName, additionalParameters)
  }
}

export const trackSafeAppEvent = (
  eventData: AnalyticsEvent,
  safeAppOrName?: SafeAppData | string,
  options?: { launchLocation?: string; sdkEventData?: any },
): void => {
  // For backward compatibility: string for simple events, SafeAppData object for launch events with full properties
  const appName = typeof safeAppOrName === 'string' ? safeAppOrName : safeAppOrName?.name

  gtmTrackSafeApp(eventData, appName, options?.sdkEventData)

  const mixpanelEventName =
    GA_TO_MIXPANEL_MAPPING[eventData.action] || (eventData.event ? GA_TO_MIXPANEL_MAPPING[eventData.event] : undefined)

  if (mixpanelEventName && safeAppOrName) {
    let mixpanelProperties: Record<string, any> = {}

    if (typeof safeAppOrName === 'object') {
      mixpanelProperties = {
        [MixpanelEventParams.SAFE_APP_NAME]: safeAppOrName.name,
        [MixpanelEventParams.SAFE_APP_TAGS]: safeAppOrName.tags,
      }

      if (options?.launchLocation) {
        mixpanelProperties[MixpanelEventParams.LAUNCH_LOCATION] = options.launchLocation
      }
    } else {
      mixpanelProperties = {
        [MixpanelEventParams.SAFE_APP_NAME]: safeAppOrName,
      }
    }

    mixpanelTrack(mixpanelEventName, mixpanelProperties)
  }
}

export const trackMixpanelEvent = mixpanelTrack

export * from './types'
export * from './events'
export * from './mixpanel-events'
