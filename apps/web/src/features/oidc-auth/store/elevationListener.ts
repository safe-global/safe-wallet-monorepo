import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { isElevationRequiredError } from '../utils/elevation'
import { startStepUp } from '../utils/stepUp'
import { getReplayableAction, savePendingStepUpAction } from '../utils/stepUpReplay'

/**
 * Recognises a `403 elevation_required` from any CGW endpoint and sends the user
 * straight to the provider's hosted page to confirm a second factor.
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
    effect: (action) => {
      if (!isElevationRequiredError(action.payload)) return

      // Stored before leaving so the action completes on the way back instead of
      // dropping the user into the app with nothing done.
      const replayable = getReplayableAction(action)
      if (replayable) savePendingStepUpAction(replayable)

      startStepUp()
    },
  })
}
