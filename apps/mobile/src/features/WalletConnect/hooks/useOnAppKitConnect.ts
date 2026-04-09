import type { Event } from '@reown/appkit-common-react-native'
import { useStableAppKitEvent } from './useStableAppKitEvent'

export type ConnectSuccessEvent = Extract<Event, { event: 'CONNECT_SUCCESS' }>

/**
 * Subscribes to the AppKit CONNECT_SUCCESS event (with typed payload)
 * and resets state on CONNECT_ERROR / USER_REJECTED.
 *
 * @param onSuccess  Called with the narrowed CONNECT_SUCCESS event data.
 * @param onFailure  Called when the connection fails or is rejected by the user.
 *                   Use this to reset ref guards so they don't leak.
 */
export function useOnAppKitConnect(onSuccess: (event: ConnectSuccessEvent) => void, onFailure: () => void) {
  useStableAppKitEvent('CONNECT_SUCCESS', (state) => {
    onSuccess(state.data as ConnectSuccessEvent)
  })

  useStableAppKitEvent('CONNECT_ERROR', onFailure)
  useStableAppKitEvent('USER_REJECTED', onFailure)
}
