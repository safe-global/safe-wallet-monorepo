import { useCallback, useRef } from 'react'
import { useAppKitEventSubscription } from '@reown/appkit-react-native'
import type { EventsControllerState as CoreEventsControllerState } from '@reown/appkit-core-react-native'
import type { EventName, Event } from '@reown/appkit-common-react-native'

export type AppKitEvent<N extends EventName> = Extract<Event, { event: N }>
type EventsControllerState<N extends EventName> = Omit<CoreEventsControllerState, 'data'> & { data: AppKitEvent<N> }

const isEventControllerState = <N extends EventName>(
  state: CoreEventsControllerState,
  eventName: N,
): state is EventsControllerState<N> => {
  return state.data.event === eventName
}

/**
 * Subscribes to a specific AppKit event with a ref-stabilized callback.
 *
 * `useAppKitEventSubscription` re-subscribes whenever the callback identity
 * changes. This wrapper stores the latest callback in a ref so the
 * subscription is created once and never torn down on re-renders.
 */
export function useStableAppKitEvent<E extends EventName>(
  event: E,
  callback: (state: EventsControllerState<E>) => void,
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const stableCallback = useCallback((state: CoreEventsControllerState) => {
    if (isEventControllerState(state, event)) {
      callbackRef.current(state)
    }
  }, [])

  useAppKitEventSubscription(event, stableCallback)
}
