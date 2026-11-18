import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/**
 * Redux slice for managing Hypernative state per Safe address.
 * State is keyed by `chainId:safeAddress` and tracks banner dismissals and form completion.
 * Automatically persisted to localStorage.
 */

export type SafeHnState = {
  bannerDismissed: boolean
  formCompleted: boolean
  pendingBannerDismissed: boolean
  bannerEligibilityTracked: boolean
}

export type HnState = {
  [chainIdAndAddress: string]: SafeHnState
}

const initialState: HnState = {}

const defaultSafeState: SafeHnState = {
  bannerDismissed: false,
  formCompleted: false,
  pendingBannerDismissed: false,
  bannerEligibilityTracked: false,
}

const ensureStateExists = (state: HnState, key: string): void => {
  if (!state[key]) {
    state[key] = { ...defaultSafeState }
  }
}

export const hnStateSlice = createSlice({
  name: 'hnState',
  initialState,
  reducers: {
    setBannerDismissed: (
      state,
      { payload }: PayloadAction<{ chainId: string; safeAddress: string; dismissed: boolean }>,
    ) => {
      const { chainId, safeAddress, dismissed } = payload
      const key = `${chainId}:${safeAddress}`
      ensureStateExists(state, key)
      state[key].bannerDismissed = dismissed
    },
    setFormCompleted: (
      state,
      { payload }: PayloadAction<{ chainId: string; safeAddress: string; completed: boolean }>,
    ) => {
      const { chainId, safeAddress, completed } = payload
      const key = `${chainId}:${safeAddress}`
      ensureStateExists(state, key)
      state[key].formCompleted = completed
    },
    setPendingBannerDismissed: (
      state,
      { payload }: PayloadAction<{ chainId: string; safeAddress: string; dismissed: boolean }>,
    ) => {
      const { chainId, safeAddress, dismissed } = payload
      const key = `${chainId}:${safeAddress}`
      ensureStateExists(state, key)
      state[key].pendingBannerDismissed = dismissed
    },
    setBannerEligibilityTracked: (
      state,
      { payload }: PayloadAction<{ chainId: string; safeAddress: string; tracked: boolean }>,
    ) => {
      const { chainId, safeAddress, tracked } = payload
      const key = `${chainId}:${safeAddress}`
      ensureStateExists(state, key)
      state[key].bannerEligibilityTracked = tracked
    },
  },
})

export const { setBannerDismissed, setFormCompleted, setPendingBannerDismissed, setBannerEligibilityTracked } =
  hnStateSlice.actions

export const selectHnState = (state: RootState): HnState => state[hnStateSlice.name] || initialState

export const selectSafeHnState = createSelector(
  [
    selectHnState,
    (_: RootState, chainId: string) => chainId,
    (_: RootState, __: string, safeAddress: string) => safeAddress,
  ],
  (hnState, chainId, safeAddress): SafeHnState | undefined => {
    const key = `${chainId}:${safeAddress}`
    return hnState[key]
  },
)
