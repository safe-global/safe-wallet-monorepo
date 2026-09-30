import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { GtfPaymentMode } from '@/features/gtf/types'

export type GtfPaymentSourcePreferenceState = Record<string, GtfPaymentMode>

const initialState: GtfPaymentSourcePreferenceState = {}

export const gtfPaymentSourcePreferenceSlice = createSlice({
  name: 'gtfPaymentSourcePreference',
  initialState,
  reducers: {
    setGtfPaymentSourcePreference: (
      state,
      { payload }: PayloadAction<{ signerAddress: string; source: GtfPaymentMode }>,
    ) => {
      state[payload.signerAddress.toLowerCase()] = payload.source
    },
  },
})

export const { setGtfPaymentSourcePreference } = gtfPaymentSourcePreferenceSlice.actions

export const selectGtfPaymentSourcePreference = (
  state: RootState,
  signerAddress: string | undefined,
): GtfPaymentMode | undefined => {
  if (!signerAddress) return undefined
  return state[gtfPaymentSourcePreferenceSlice.name][signerAddress.toLowerCase()]
}
