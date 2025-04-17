import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import { Address, SignerInfo } from '../types/address'

type ActiveSignerState = Record<Address, SignerInfo>

const initialState: ActiveSignerState = {}

const activeSignerSlice = createSlice({
  name: 'activeSigner',
  initialState,
  reducers: {
    setActiveSigner: (state, action: PayloadAction<{ safeAddress: Address; signer: SignerInfo }>) => {
      state[action.payload.safeAddress] = action.payload.signer
      return state
    },
    removeActiveSigner: (state, action: PayloadAction<{ safeAddress: Address }>) => {
      const { [action.payload.safeAddress]: _, ...rest } = state

      return rest
    },
  },
})

export const { setActiveSigner, removeActiveSigner } = activeSignerSlice.actions

export const selectActiveSigner = createSelector(
  [(state: RootState) => state.activeSigner, (_state: RootState, safeAddress: Address) => safeAddress],
  (activeSigner, safeAddress: Address) => activeSigner[safeAddress],
)

export default activeSignerSlice.reducer
