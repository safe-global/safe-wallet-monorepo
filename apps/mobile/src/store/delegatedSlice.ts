import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '.'
import { Address, SafeInfo } from '../types/address'

export interface SafesSliceItem {
  safes: SafeInfo[]
}

export type DelegatedSafesSlice = Record<Address, SafesSliceItem>

const initialState: DelegatedSafesSlice = {}

const delegatedSlice = createSlice({
  name: 'delegated',
  initialState,
  reducers: {
    addOrUpdateDelegatedAddress: (state, action: PayloadAction<{ delegatedAddress: Address; safes: SafeInfo[] }>) => {
      const { delegatedAddress, safes } = action.payload
      if (!state[delegatedAddress]) {
        state[delegatedAddress] = { safes }
      } else {
        state[delegatedAddress].safes = safes
      }
    },
  },
})

export const { addOrUpdateDelegatedAddress } = delegatedSlice.actions

export const selectDelegatedAddresses = (state: RootState) => state.delegatedAddresses

export default delegatedSlice.reducer
