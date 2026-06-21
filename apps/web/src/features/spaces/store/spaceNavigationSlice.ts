import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

interface SpaceNavigationState {
  /**
   * Matched route of the last space sub-page visited (e.g. `/spaces/security`), so the in-Safe
   * "Back to workspace" link can return there instead of the workspace landing.
   *
   * Deliberately a standalone, NON-persisted slice: this is transient per-tab, per-session
   * navigation context. Persisting/broadcasting it (as the `auth` slice does for `lastUsedSpace`)
   * would let a stale value from a previous session — or a different browser tab — decide where
   * "back" goes, which is wrong for a back affordance.
   */
  lastUsedSpacePath: string | null
}

const initialState: SpaceNavigationState = {
  lastUsedSpacePath: null,
}

export const spaceNavigationSlice = createSlice({
  name: 'spaceNavigation',
  initialState,
  reducers: {
    setLastUsedSpacePath: (state, action: PayloadAction<string | null>) => {
      state.lastUsedSpacePath = action.payload
    },
  },
})

export const { setLastUsedSpacePath } = spaceNavigationSlice.actions

export const selectLastUsedSpacePath = (state: RootState) => state[spaceNavigationSlice.name].lastUsedSpacePath
