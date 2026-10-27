import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { FeePaymentMode } from '@/features/pay-from-safe/types'

export type FeePaymentSourcePreferenceState = Record<string, FeePaymentMode>

const initialState: FeePaymentSourcePreferenceState = {}

export const feePaymentSourcePreferenceSlice = createSlice({
  name: 'feePaymentSourcePreference',
  initialState,
  reducers: {
    setFeePaymentSourcePreference: (
      state,
      { payload }: PayloadAction<{ signerAddress: string; source: FeePaymentMode }>,
    ) => {
      state[payload.signerAddress.toLowerCase()] = payload.source
    },
  },
})

export const { setFeePaymentSourcePreference } = feePaymentSourcePreferenceSlice.actions

export const selectFeePaymentSourcePreference = (
  state: RootState,
  signerAddress: string | undefined,
): FeePaymentMode | undefined => {
  if (!signerAddress) return undefined
  return state[feePaymentSourcePreferenceSlice.name][signerAddress.toLowerCase()]
}
