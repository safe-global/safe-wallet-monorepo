import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { resetE2EState } from './resetE2EState'

export interface EstimatedFeeValues {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  gasLimit: bigint
  nonce: number
}

export type EstimatedFeeState = EstimatedFeeValues | null

const initialState = null as EstimatedFeeState

const estimatedFeeSlice = createSlice({
  name: 'estimatedFee',
  initialState,
  reducers: {
    setEstimatedFeeValues: (_, action: PayloadAction<EstimatedFeeValues>) => {
      return action.payload
    },
    clearEstimatedFeeValues: () => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetE2EState, () => initialState)
  },
})

export const { setEstimatedFeeValues, clearEstimatedFeeValues } = estimatedFeeSlice.actions

export const selectEstimatedFee = (state: RootState): EstimatedFeeState => state[estimatedFeeSlice.name]

export default estimatedFeeSlice.reducer
