import { AnalyticsEvent, EventType } from '../types'

const SAFES_CATEGORY = 'safes'

/**
 * Creates an analytics event for when a safe is added to the app
 */
export const createSafeAddedEvent = (totalSafeCount: number): AnalyticsEvent => ({
  eventName: EventType.META,
  eventCategory: SAFES_CATEGORY,
  eventAction: 'Safe added',
  eventLabel: totalSafeCount,
})

/**
 * Creates an analytics event for when a safe is removed from the app
 */
export const createSafeRemovedEvent = (totalSafeCount: number): AnalyticsEvent => ({
  eventName: EventType.META,
  eventCategory: SAFES_CATEGORY,
  eventAction: 'Safe removed',
  eventLabel: totalSafeCount,
})
