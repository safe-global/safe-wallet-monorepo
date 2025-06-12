import { EventType } from '../types'

const OVERVIEW_CATEGORY = 'overview'

export const OVERVIEW_EVENTS = {
  SAFE_VIEWED: {
    eventName: EventType.SAFE_OPENED,
    eventCategory: OVERVIEW_CATEGORY,
    eventAction: 'Safe viewed',
  },
}
