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
