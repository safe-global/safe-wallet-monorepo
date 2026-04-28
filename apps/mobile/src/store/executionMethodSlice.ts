import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

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
})

export const { setExecutionMethod, clearExecutionMethod } = executionMethodSlice.actions

export const selectExecutionMethod = (state: RootState): ExecutionMethodState => state[executionMethodSlice.name]

export default executionMethodSlice.reducer
