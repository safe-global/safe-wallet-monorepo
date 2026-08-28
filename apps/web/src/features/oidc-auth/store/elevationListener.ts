import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { isElevationRequiredError } from '../utils/elevation'
import { getReplayableAction, saveStepUpTrip } from '../utils/stepUpReplay'
import { selectStepUpPhase, stepUpLeaving } from './stepUpSlice'

/**
 * Lives on the store rather than in the ten places that call a gated endpoint,
 * so when CGW gates another route it works without a frontend change.
 */
export const elevationListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    // RTK Query reports a baseQuery failure with `rejectWithValue`, so the
    // FetchBaseQueryError is the action payload.
    matcher: isRejectedWithValue(),
    effect: (action, { dispatch, getState }) => {
      if (!isElevationRequiredError(action.payload)) return

      // If the replayed request is itself rejected, show that error in the app.
      // Saving another trip here would send the user back to Auth0 in a loop.
      if (selectStepUpPhase(getState()) === 'returning') return

      saveStepUpTrip(getReplayableAction(action))

      dispatch(stepUpLeaving())
    },
  })
}
