import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/src/store'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

interface ExecutingState {
  status: 'executing' | 'success' | 'error'
  startedAt: number
  completedAt?: number
  executionMethod: ExecutionMethod
  error?: string
}

interface ExecutingStateSlice {
  executions: Record<string, ExecutingState>
}

const initialState: ExecutingStateSlice = {
  executions: {},
}

export const executingStateSlice = createSlice({
  name: 'executingState',
  initialState,
  reducers: {
    startExecuting: (state, action: PayloadAction<{ txId: string; executionMethod: ExecutionMethod }>) => {
      const { txId, executionMethod } = action.payload
      state.executions[txId] = {
        status: 'executing',
        startedAt: Date.now(),
        executionMethod,
      }
    },

    setExecutingSuccess: (state, action: PayloadAction<string>) => {
      const txId = action.payload
      if (state.executions[txId]) {
        state.executions[txId].status = 'success'
        state.executions[txId].completedAt = Date.now()
      }
    },

    setExecutingError: (state, action: PayloadAction<{ txId: string; error: string }>) => {
      const { txId, error } = action.payload
      if (state.executions[txId]) {
        state.executions[txId].status = 'error'
        state.executions[txId].completedAt = Date.now()
        state.executions[txId].error = error
      }
    },

    clearExecuting: (state, action: PayloadAction<string>) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state.executions[action.payload]
    },
  },
})

export const { startExecuting, setExecutingSuccess, setExecutingError, clearExecuting } = executingStateSlice.actions

export const selectExecutingState = (state: RootState, txId: string) => state.executingState.executions[txId]

export const selectIsExecuting = (state: RootState, txId: string) =>
  state.executingState.executions[txId]?.status === 'executing'

export default executingStateSlice.reducer
