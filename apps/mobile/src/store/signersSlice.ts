import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { RootState } from '.'

const initialState: Record<string, AddressInfo> = {}

const signersSlice = createSlice({
  name: 'signers',
  initialState,
  reducers: {
    addSigner: (state, action: PayloadAction<AddressInfo>) => {
      state[action.payload.value] = action.payload

      return state
    },
  },
})

export const { addSigner } = signersSlice.actions

export const selectSigners = (state: RootState) => state.signers

export default signersSlice.reducer
