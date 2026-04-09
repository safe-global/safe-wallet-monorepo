import { useCallback, useRef } from 'react'
import { useAppKitEventSubscription } from '@reown/appkit-react-native'
import type { EventsControllerState } from '@reown/appkit-core-react-native'
import type { EventName } from '@reown/appkit-common-react-native'

/**
 * Subscribes to a specific AppKit event with a ref-stabilized callback.
 *
 * `useAppKitEventSubscription` re-subscribes whenever the callback identity
 * changes. This wrapper stores the latest callback in a ref so the
 * subscription is created once and never torn down on re-renders.
 */
export function useStableAppKitEvent(event: EventName, callback: (state: EventsControllerState) => void) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const stableCallback = useCallback((state: EventsControllerState) => {
    if (state.data.event === event) {
      callbackRef.current(state)
    }
  }, [])

  useAppKitEventSubscription(event, stableCallback)
}
