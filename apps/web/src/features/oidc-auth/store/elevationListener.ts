import { isRejectedWithValue } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { isElevationRequiredError } from '../utils/elevation'
import { getReplayableAction, saveStepUpTrip } from '../utils/stepUpReplay'
import { selectStepUpPhase, stepUpLeaving } from './stepUpSlice'

/**
 * Lives on the store rather than in the ten places that call a gated endpoint,
 * so a newly gated route starts the step-up without a frontend change. The
 * replay is separate: only the endpoints in `REPLAYABLE_ENDPOINTS` are sent
 * again, and a route missing from that list leaves the user to click a second
 * time once the session is elevated.
 */
export const elevationListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    matcher: isRejectedWithValue(),
    effect: (action, { dispatch, getState }) => {
      if (!isElevationRequiredError(action.payload)) return

      // Without this, a rejection from the replayed request would save another
      // trip and send the user to Auth0 again, without end.
      if (selectStepUpPhase(getState()) === 'returning') return

      saveStepUpTrip(getReplayableAction(action))

      dispatch(stepUpLeaving())
    },
  })
}
