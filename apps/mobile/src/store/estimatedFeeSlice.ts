import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'

export interface EstimatedFeeValues {
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  gasLimit?: bigint
  nonce?: number
}


export type EstimatedFeeState = EstimatedFeeValues

const initialState: EstimatedFeeState = {}

const estimatedFeeSlice = createSlice({
  name: 'estimatedFee',
  initialState,
  reducers: {
    setEstimatedFeeValues: (state, action: PayloadAction<Partial<EstimatedFeeValues>>) => {
      return { ...state, ...action.payload }
    },
    clearEstimatedFeeValues: () => {
      return initialState
    },
  },
})

export const { setEstimatedFeeValues, clearEstimatedFeeValues } = estimatedFeeSlice.actions

export const selectEstimatedFee = (state: RootState): EstimatedFeeState => state[estimatedFeeSlice.name]


export default estimatedFeeSlice.reducer



