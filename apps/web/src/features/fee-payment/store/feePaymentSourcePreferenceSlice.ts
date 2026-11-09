import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { GasPayerChoice } from '@/features/fee-payment/types'

/** The payer a signer can pick at signing; a sponsor is only picked at execution. */
export type RememberedFeePayer = Extract<GasPayerChoice, 'PAY_FROM_SAFE' | 'WALLET'>

export type FeePaymentSourcePreferenceState = Record<string, RememberedFeePayer>

const initialState: FeePaymentSourcePreferenceState = {}

export const feePaymentSourcePreferenceSlice = createSlice({
  name: 'feePaymentSourcePreference',
  initialState,
  reducers: {
    setFeePaymentSourcePreference: (
      state,
      { payload }: PayloadAction<{ signerAddress: string; source: RememberedFeePayer }>,
    ) => {
      state[payload.signerAddress.toLowerCase()] = payload.source
    },
  },
})

export const { setFeePaymentSourcePreference } = feePaymentSourcePreferenceSlice.actions

export const selectFeePaymentSourcePreference = (
  state: RootState,
  signerAddress: string | undefined,
): RememberedFeePayer | undefined => {
  if (!signerAddress) return undefined
  return state[feePaymentSourcePreferenceSlice.name][signerAddress.toLowerCase()]
}
