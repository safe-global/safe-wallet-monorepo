import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

export type AddressPoisoningState = {
  /**
   * Dismissed (user-vetted) candidate addresses, keyed by the connected account
   * so one profile's vetted recipients never leak to another. All lowercased.
   */
  dismissedByAccount: { [account: string]: string[] }
}

const initialState: AddressPoisoningState = {
  dismissedByAccount: {},
}

export const addressPoisoningSlice = createSlice({
  name: 'addressPoisoning',
  initialState,
  reducers: {
    dismissSimilarAddress: (state, action: PayloadAction<{ account: string; candidate: string }>) => {
      const account = action.payload.account.toLowerCase()
      const candidate = action.payload.candidate.toLowerCase()
      const dismissed = state.dismissedByAccount[account] ?? (state.dismissedByAccount[account] = [])
      if (!dismissed.includes(candidate)) {
        dismissed.push(candidate)
      }
    },
  },
})

export const { dismissSimilarAddress } = addressPoisoningSlice.actions

const selectAddressPoisoning = (state: RootState): AddressPoisoningState => state[addressPoisoningSlice.name]

export const selectIsSimilarAddressDismissed = createSelector(
  [
    selectAddressPoisoning,
    (_: RootState, account: string) => account,
    (_: RootState, _account: string, candidate: string) => candidate,
  ],
  (slice, account, candidate): boolean =>
    slice.dismissedByAccount[account.toLowerCase()]?.includes(candidate.toLowerCase()) ?? false,
)
