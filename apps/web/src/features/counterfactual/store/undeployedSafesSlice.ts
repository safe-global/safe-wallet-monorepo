import { type RootState } from '@/store'
import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { selectChainIdAndSafeAddress } from '@/store/common'
import type {
  UndeployedSafe,
  UndeployedSafesState,
  UndeployedSafeStatus,
  PredictedSafeProps,
  ReplayedSafeProps,
  PayMethod,
} from '../types'
import { PendingSafeStatus } from '../types'

const initialState: UndeployedSafesState = {}

export const undeployedSafesSlice = createSlice({
  name: 'undeployedSafes',
  initialState,
  reducers: {
    addUndeployedSafe: (
      state,
      action: PayloadAction<{
        chainId: string
        address: string
        type: PayMethod
        safeProps: PredictedSafeProps | ReplayedSafeProps
        // Default true — locally-initiated creations are always by the current user.
        // Sync from the space endpoint (safes created by other members) passes false.
        isCreator?: boolean
      }>,
    ) => {
      const { chainId, address, type, safeProps, isCreator = true } = action.payload

      if (!state[chainId]) {
        state[chainId] = {}
      }

      state[chainId][address] = {
        props: safeProps,
        status: {
          status: PendingSafeStatus.AWAITING_EXECUTION,
          type,
        },
        isCreator,
      }
    },

    addUndeployedSafes: (_, { payload }: PayloadAction<UndeployedSafesState>) => {
      // We must return as we are overwriting the entire state
      return payload
    },

    updateUndeployedSafeStatus: (
      state,
      action: PayloadAction<{ chainId: string; address: string; status: Omit<UndeployedSafeStatus, 'type'> }>,
    ) => {
      const { chainId, address, status } = action.payload

      if (!state[chainId]?.[address]) return state

      const existing = state[chainId][address]
      state[chainId][address] = {
        ...existing,
        props: existing.props,
        status: {
          ...existing.status,
          ...status,
        },
      }
    },

    removeUndeployedSafe: (state, action: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = action.payload
      if (!state[chainId]) return state

      delete state[chainId][address]

      if (Object.keys(state[chainId]).length > 0) return state

      delete state[chainId]
    },
  },
})

export const { removeUndeployedSafe, addUndeployedSafe, updateUndeployedSafeStatus } = undeployedSafesSlice.actions

export const selectUndeployedSafes = (state: RootState): UndeployedSafesState => {
  return state[undeployedSafesSlice.name]
}

export const selectUndeployedSafe = createSelector(
  [selectUndeployedSafes, selectChainIdAndSafeAddress],
  (undeployedSafes, [chainId, address]): UndeployedSafe | undefined => {
    return undeployedSafes[chainId]?.[address]
  },
)

export const selectIsUndeployedSafe = createSelector([selectUndeployedSafe], (undeployedSafe) => {
  return !!undeployedSafe
})
