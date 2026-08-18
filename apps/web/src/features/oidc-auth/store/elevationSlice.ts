import { createSlice, isRejectedWithValue } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { isElevationRequiredError } from '../utils/elevation'
import { getReplayableAction, savePendingStepUpAction } from '../utils/stepUpReplay'

type ElevationState = {
  /** Whether a sensitive action was rejected for want of a fresh second factor. */
  isRequired: boolean
}

const initialState: ElevationState = {
  isRequired: false,
}

/**
 * Tracks CGW's step-up challenge. Intentionally not persisted: elevation is a
 * property of the current session, so a stale flag must never survive a reload.
 */
export const elevationSlice = createSlice({
  name: 'elevation',
  initialState,
  reducers: {
    requireElevation: (state) => {
      state.isRequired = true
    },
    clearElevationRequired: (state) => {
      state.isRequired = false
    },
  },
})

export const { requireElevation, clearElevationRequired } = elevationSlice.actions

export const selectIsElevationRequired = (state: RootState): boolean => state.elevation.isRequired

/**
 * Recognises a `403 elevation_required` from any CGW endpoint and raises the
 * step-up prompt.
 *
 * This sits on the store rather than at the ~16 gated call sites so a route
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

      // Held for the redirect so the action completes on the way back instead of
      // dropping the user into the app with nothing done.
      const replayable = getReplayableAction(action)
      if (replayable) savePendingStepUpAction(replayable)

      dispatch(requireElevation())
    },
  })
}
