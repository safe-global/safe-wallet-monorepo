import { EventType } from '../types'

const NATIVE_INTENT_CATEGORY = 'native-intent'

export const NATIVE_INTENT_EVENTS = {
  PROTECTED_ROUTE_ATTEMPT: {
    eventName: EventType.META,
    eventCategory: NATIVE_INTENT_CATEGORY,
    eventAction: 'Attempted access to protected route',
    // eventLabel will be the route path
  },
}

export const createProtectedRouteAttemptEvent = (path: string) => ({
  ...NATIVE_INTENT_EVENTS.PROTECTED_ROUTE_ATTEMPT,
  eventLabel: path,
})
