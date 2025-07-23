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
import { gtmTrack, gtmTrackSafeApp } from './gtm'
import { mixpanelTrack, safeAppToMixPanelEventProperties } from './mixpanel'

export const trackEvent = gtmTrack
export const trackSafeAppEvent = gtmTrackSafeApp

export const trackMixPanelEvent = mixpanelTrack
export { safeAppToMixPanelEventProperties }

export * from './types'
export * from './events'
export * from './mixpanel-events'
