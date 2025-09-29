import { EventType } from '../types'

const SIGNERS_CATEGORY = 'signers'

/**
 * Track when a new signer is added to the app
 * @param totalSignerCount - The total number of signers after addition
 */
export const createSignerAddedEvent = (totalSignerCount: number) => ({
  eventName: EventType.META,
  eventCategory: SIGNERS_CATEGORY,
  eventAction: 'Signer added',
  eventLabel: totalSignerCount.toString(),
})
