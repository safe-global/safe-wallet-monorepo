import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

export interface DelegateInfo {
  safe: string | null
  delegate: string
  delegator: string
  label: string
}

export type DelegatesSliceState = Record<string, Record<string, DelegateInfo>>

const initialState: DelegatesSliceState = {}

const delegatesSlice = createSlice({
  name: 'delegates',
  initialState,
  reducers: {
    addDelegate: (
      state,
      action: PayloadAction<{
        ownerAddress: string
        delegateAddress: string
        delegateInfo: DelegateInfo
      }>,
    ) => {
      const { ownerAddress, delegateAddress, delegateInfo } = action.payload

      if (!state[ownerAddress]) {
        state[ownerAddress] = {}
      }

      state[ownerAddress][delegateAddress] = delegateInfo
    },

    removeDelegate: (
      state,
      action: PayloadAction<{
        ownerAddress: string
        delegateAddress: string
      }>,
    ) => {
      const { ownerAddress, delegateAddress } = action.payload

      if (state[ownerAddress] && state[ownerAddress][delegateAddress]) {
        delete state[ownerAddress][delegateAddress]

        // Clean up empty owner entries
        if (Object.keys(state[ownerAddress]).length === 0) {
          delete state[ownerAddress]
        }
      }
    },
  },
})

export const { addDelegate, removeDelegate } = delegatesSlice.actions

export const selectDelegates = (state: RootState): DelegatesSliceState => state.delegates
export const selectDelegatesByOwner = (state: RootState, ownerAddress: string) => state.delegates[ownerAddress] || {}

export default delegatesSlice.reducer
