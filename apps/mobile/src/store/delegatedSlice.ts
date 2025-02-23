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
    addDelegatedAddress: (state, action: PayloadAction<{ delegatedAddress: Address; safes: SafeInfo[] }>) => {
      const { delegatedAddress, safes } = action.payload
      state[delegatedAddress] = { safes }
    },
    updateDelegatedAddress: (state, action: PayloadAction<{ delegatedAddress: Address; safes: SafeInfo[] }>) => {
      const { delegatedAddress, safes } = action.payload

      state[delegatedAddress] = { ...safes, safes }

      return state
    },
  },
})

export const { addDelegatedAddress, updateDelegatedAddress } = delegatedSlice.actions

export const selectDelegatedAddresses = (state: RootState) => state.delegatedAddresses

export default delegatedSlice.reducer
