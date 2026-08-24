import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { isElevationRequiredError } from '../utils/elevation'
import { isStepUpReturnInFlight } from '../utils/stepUp'
import { getReplayableAction, saveStepUpTrip } from '../utils/stepUpReplay'
import { stepUpLeaving } from './stepUpSlice'

/**
 * Recognises a `403 elevation_required` from any CGW endpoint and hands off to
 * `StepUpScreen`, which paints the splash and then sends the user to the
 * provider's hosted page to confirm a second factor.
 *
 * This sits on the store rather than at the ten gated call sites so a route
 * newly gated by CGW is handled without a matching frontend change. Call sites
 * keep their own error rendering; `getRtkQueryErrorMessage` translates the raw
 * marker so none of them show it verbatim.
 */
export const elevationListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    // RTK Query surfaces a baseQuery failure via `rejectWithValue`, so the
    // FetchBaseQueryError is the action payload.
    matcher: isRejectedWithValue(),
    effect: (action, { dispatch }) => {
      if (!isElevationRequiredError(action.payload)) return

      // A challenge raised by the replayed action itself must surface inline,
      // not record a new trip and bounce back out to the provider.
      if (isStepUpReturnInFlight()) return

      // One record — in-flight marker and payload together — written before
      // leaving so the action completes on the way back.
      saveStepUpTrip(getReplayableAction(action))

      dispatch(stepUpLeaving())
    },
  })
}
