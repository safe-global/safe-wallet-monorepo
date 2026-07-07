import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export interface SpaceNavigationOrigin {
  /** Matched route of the space sub-page the user entered a Safe from (e.g. `/spaces/security`). */
  path: string
  /** The space that sub-page belonged to. "Back" is only honored when the current space matches. */
  spaceId: string
}

interface SpaceNavigationState {
  /**
   * Where the in-Safe "Back to workspace" link should return: the last space sub-page visited,
   * scoped to the space it belonged to.
   *
   * Deliberately a standalone, NON-persisted slice: this is transient per-tab, per-session
   * navigation context. Persisting/broadcasting it (as the `auth` slice does for `lastUsedSpace`)
   * would let a stale value from a previous session — or a different browser tab — decide where
   * "back" goes, which is wrong for a back affordance.
   *
   * Scoped by `spaceId` so a stale origin from one workspace never misroutes "back" after the user
   * later opens a Safe belonging to a different workspace — the consumer falls back to the
   * workspace landing whenever the recorded space no longer matches the current one.
   */
  origin: SpaceNavigationOrigin | null
}

const initialState: SpaceNavigationState = {
  origin: null,
}

export const spaceNavigationSlice = createSlice({
  name: 'spaceNavigation',
  initialState,
  reducers: {
    setLastUsedSpaceOrigin: (state, action: PayloadAction<SpaceNavigationOrigin | null>) => {
      state.origin = action.payload
    },
  },
})

export const { setLastUsedSpaceOrigin } = spaceNavigationSlice.actions

export const selectLastUsedSpaceOrigin = (state: RootState) => state[spaceNavigationSlice.name].origin
