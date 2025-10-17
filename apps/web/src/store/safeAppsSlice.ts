import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { RootState } from '@/store'

type SafeAppsPerChain = {
  pinned: Array<SafeAppData['id']>
  opened: Array<SafeAppData['id']>
}

export type SafeAppsState = {
  [chainId: string]: SafeAppsPerChain
}

const initialState: SafeAppsState = {}

export const safeAppsSlice = createSlice({
  name: 'safeApps',
  initialState,
  reducers: {
    setPinned: (state, { payload }: PayloadAction<{ chainId: string; pinned: SafeAppsPerChain['pinned'] }>) => {
      const { pinned, chainId } = payload

      // Initialise chain-specific state
      state[chainId] ??= { pinned: [], opened: [] }
      // If apps were opened before any were pinned, no pinned array exists
      state[chainId].pinned ??= []

      state[chainId].pinned = pinned
    },
    markOpened: (state, { payload }: PayloadAction<{ chainId: string; id: SafeAppData['id'] }>) => {
      const { id, chainId } = payload

      // Initialise chain-specific state
      state[chainId] ??= { pinned: [], opened: [] }
      // If apps were pinned before any were opened, no opened array exists
      state[chainId].opened ??= []

      if (!state[chainId].opened.includes(id)) {
        state[chainId].opened.push(id)
      }
    },
    setSafeApps: (_, { payload }: PayloadAction<SafeAppsState>) => {
      // We must return as we are overwriting the entire state
      return payload
    },
  },
})

export const { setPinned, markOpened } = safeAppsSlice.actions

export const selectSafeApps = (state: RootState): SafeAppsState => {
  return state[safeAppsSlice.name]
}

const selectSafeAppsPerChain = createSelector(
  [selectSafeApps, (_: RootState, chainId: string) => chainId],
  (safeApps, chainId) => {
    return safeApps[chainId]
  },
)

export const selectPinned = createSelector([selectSafeAppsPerChain], (safeAppsPerChain) => {
  return safeAppsPerChain?.pinned || []
})

export const selectOpened = createSelector([selectSafeAppsPerChain], (safeAppsPerChain) => {
  return safeAppsPerChain?.opened || []
})
