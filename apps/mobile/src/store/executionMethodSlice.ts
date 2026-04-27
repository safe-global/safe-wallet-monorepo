import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { resetE2EState } from './resetE2EState'

export type ExecutionMethodState = ExecutionMethod

const initialState = ExecutionMethod.WITH_RELAY as ExecutionMethodState

const executionMethodSlice = createSlice({
  name: 'executionMethod',
  initialState,
  reducers: {
    setExecutionMethod: (_, action: PayloadAction<ExecutionMethod>) => {
      return action.payload
    },
    clearExecutionMethod: () => {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetE2EState, () => initialState)
  },
})

export const { setExecutionMethod, clearExecutionMethod } = executionMethodSlice.actions

export const selectExecutionMethod = (state: RootState): ExecutionMethodState => state[executionMethodSlice.name]

export default executionMethodSlice.reducer
