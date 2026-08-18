import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import { isKnownFeature } from '@/features/feature-flag-overrides/knownFeatures'
import type { RootState } from '@/store'

export type FeatureFlagOverridesState = Partial<Record<FEATURES, boolean>>

const initialState: FeatureFlagOverridesState = {}

export const featureFlagOverridesSlice = createSlice({
  name: 'featureFlagOverrides',
  initialState,
  reducers: {
    setOverride: (state, { payload }: PayloadAction<{ feature: FEATURES; value: boolean }>) => {
      state[payload.feature] = payload.value
    },
    clearOverride: (state, { payload }: PayloadAction<FEATURES>) => {
      delete state[payload]
    },
    /**
     * Resets the flags this build declares, and only those. Overrides of flags it does not know
     * belong to the branch that declared them — that branch's editor is the only place they can be
     * seen, so this one must not silently wipe them.
     */
    clearAllOverrides: (state): FeatureFlagOverridesState =>
      Object.fromEntries(Object.entries(state).filter(([feature]) => !isKnownFeature(feature))),
  },
})

export const { setOverride, clearOverride, clearAllOverrides } = featureFlagOverridesSlice.actions

export const selectFeatureFlagOverrides = (state: RootState): FeatureFlagOverridesState =>
  state[featureFlagOverridesSlice.name] || initialState

/**
 * Counts only overrides of flags this build declares — the editor lists `FEATURES` and nothing
 * else, so counting a leftover would badge an override the user can neither see nor clear.
 */
export const selectOverrideCount = createSelector(
  selectFeatureFlagOverrides,
  (overrides) => Object.keys(overrides).filter(isKnownFeature).length,
)
