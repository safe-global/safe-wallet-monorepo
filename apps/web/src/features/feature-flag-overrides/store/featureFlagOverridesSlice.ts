import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { FEATURES } from '@safe-global/utils/utils/chains'
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

export const selectOverrideCount = createSelector(
  selectFeatureFlagOverrides,
  (overrides) => Object.keys(overrides).length,
)
