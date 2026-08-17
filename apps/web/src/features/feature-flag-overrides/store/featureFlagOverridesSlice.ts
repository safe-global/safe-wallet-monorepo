import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import { FEATURES } from '@safe-global/utils/utils/chains'
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
    clearAllOverrides: () => ({}),
  },
})

export const { setOverride, clearOverride, clearAllOverrides } = featureFlagOverridesSlice.actions

export const selectFeatureFlagOverrides = (state: RootState): FeatureFlagOverridesState =>
  state[featureFlagOverridesSlice.name] || initialState

const KNOWN_FEATURES = new Set<string>(Object.values(FEATURES))

export const isKnownFeature = (feature: string): feature is FEATURES => KNOWN_FEATURES.has(feature)

/**
 * Counts only overrides of flags this build declares.
 *
 * Overrides are persisted, so they outlive the enum: a flag overridden on a branch that adds it
 * stays in localStorage after switching to a branch that never declared it. The editor lists
 * `FEATURES` and nothing else, so counting those leftovers badges overrides the user can neither
 * see nor clear individually.
 */
export const selectOverrideCount = createSelector(
  selectFeatureFlagOverrides,
  (overrides) => Object.keys(overrides).filter(isKnownFeature).length,
)
