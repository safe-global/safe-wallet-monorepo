import { EventType } from '../types'

const OVERVIEW_CATEGORY = 'overview'

export const OVERVIEW_EVENTS = {
  SAFE_VIEWED: {
    eventName: EventType.SAFE_OPENED,
    eventCategory: 'safe',
    eventAction: 'opened',
    eventLabel: 'safe_viewed',
  },
}

/**
 * Creates an analytics event for when the My accounts screen is viewed
 */
export const createMyAccountsScreenViewEvent = (totalSafeCount: number) => ({
  eventName: EventType.SCREEN_VIEW,
  eventCategory: OVERVIEW_CATEGORY,
  eventAction: 'My accounts screen viewed',
  eventLabel: totalSafeCount,
})

/**
 * Creates an analytics event for when the user enters or exits edit mode on My accounts screen
 */
export const createMyAccountsEditModeEvent = (isEnteringEditMode: boolean, totalSafeCount: number) => ({
  eventName: EventType.META,
  eventCategory: OVERVIEW_CATEGORY,
  eventAction: isEnteringEditMode ? 'Edit mode entered' : 'Edit mode exited',
  eventLabel: totalSafeCount,
})

/**
 * Creates an analytics event for when the user reorders safes using drag-and-drop
 */
export const createSafeReorderEvent = (totalSafeCount: number) => ({
  eventName: EventType.META,
  eventCategory: OVERVIEW_CATEGORY,
  eventAction: 'Safe reordered',
  eventLabel: totalSafeCount,
})

export type ScanForNewNetworksResult = 'success' | 'empty' | 'error'

/**
 * Creates an analytics event for the "Check for new networks" action on the network selector sheet.
 * eventLabel encodes the result; newChainsFound is provided as a numeric param for "success" results.
 */
export const createScanForNewNetworksEvent = (result: ScanForNewNetworksResult, newChainsFound: number) => ({
  eventName: EventType.CLICK,
  eventCategory: OVERVIEW_CATEGORY,
  eventAction: 'Check for new networks',
  eventLabel: result === 'success' ? `success:${newChainsFound}` : result,
})
