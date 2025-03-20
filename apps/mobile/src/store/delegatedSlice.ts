import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { RootState } from '.'
import { Address, SafeInfo } from '../types/address'
import { NOTIFICATION_ACCOUNT_TYPE } from './constants'

type AccountDetails = {
  address: string
  type: NOTIFICATION_ACCOUNT_TYPE
}
export interface SafesSliceItem {
  accountDetails: AccountDetails
  safes: SafeInfo[]
}

export type DelegatedSafesSlice = Record<Address, SafesSliceItem>

const initialState: DelegatedSafesSlice = {}

const delegatedSlice = createSlice({
  name: 'delegated',
  initialState,
  reducers: {
    addOrUpdateDelegatedAccount: (
      state,
      action: PayloadAction<{ accountDetails: AccountDetails; safes: SafeInfo[] }>,
    ) => {
      const { accountDetails, safes } = action.payload

      if (!state[accountDetails.address as Address]) {
        state[accountDetails.address as Address] = { accountDetails, safes }
      } else {
        state[accountDetails.address as Address].safes = safes
      }
    },
  },
})

export const { addOrUpdateDelegatedAccount } = delegatedSlice.actions

export const selectDelegatedAccounts = (state: RootState): DelegatedSafesSlice => state.delegated

export default delegatedSlice.reducer
