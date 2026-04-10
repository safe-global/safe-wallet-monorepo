import { AppKitEvent, useStableAppKitEvent } from './useStableAppKitEvent'

/**
 * Subscribes to the AppKit CONNECT_SUCCESS event (with typed payload)
 * and resets state on CONNECT_ERROR / USER_REJECTED.
 *
 * @param onSuccess  Called with the narrowed CONNECT_SUCCESS event data.
 * @param onFailure  Called when the connection fails or is rejected by the user.
 *                   Use this to reset ref guards so they don't leak.
 */
export function useOnAppKitConnect(onSuccess: (event: AppKitEvent<'CONNECT_SUCCESS'>) => void, onFailure: () => void) {
  useStableAppKitEvent('CONNECT_SUCCESS', (state) => onSuccess(state.data))

  useStableAppKitEvent('CONNECT_ERROR', onFailure)
  useStableAppKitEvent('USER_REJECTED', onFailure)
}
