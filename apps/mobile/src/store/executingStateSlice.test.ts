import executingStateReducer, {
  startExecuting,
  setExecutingSuccess,
  setExecutingError,
  clearExecuting,
  selectExecutingState,
  selectIsExecuting,
} from './executingStateSlice'
import { RootState } from '@/src/store'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

type ExecutingStateSlice = ReturnType<typeof executingStateReducer>

describe('executingStateSlice', () => {
  const createMockState = (): ExecutingStateSlice => ({
    executions: {},
  })

  const createMockRootState = (executingState = createMockState()) =>
    ({
      executingState,
    }) as RootState

  describe('reducers', () => {
    it('startExecuting adds transaction to executing state', () => {
      const initialState = createMockState()
      const txId = 'tx123'

      const action = startExecuting({ txId, executionMethod: ExecutionMethod.WITH_PK })
      const newState = executingStateReducer(initialState, action)

      expect(newState.executions[txId]).toEqual({
        status: 'executing',
        startedAt: expect.any(Number),
        executionMethod: ExecutionMethod.WITH_PK,
      })
    })

    it('startExecuting stores execution method correctly', () => {
      const initialState = createMockState()

      const actionRelay = startExecuting({ txId: 'tx1', executionMethod: ExecutionMethod.WITH_RELAY })
      const stateAfterRelay = executingStateReducer(initialState, actionRelay)
      expect(stateAfterRelay.executions['tx1'].executionMethod).toBe(ExecutionMethod.WITH_RELAY)

      const actionLedger = startExecuting({ txId: 'tx2', executionMethod: ExecutionMethod.WITH_LEDGER })
      const stateAfterLedger = executingStateReducer(stateAfterRelay, actionLedger)
      expect(stateAfterLedger.executions['tx2'].executionMethod).toBe(ExecutionMethod.WITH_LEDGER)
    })

    it('setExecutingSuccess updates executing state to success', () => {
      const initialState: ExecutingStateSlice = {
        executions: {
          tx123: {
            status: 'executing',
            startedAt: 1234567890,
            executionMethod: ExecutionMethod.WITH_PK,
          },
        },
      }

      const action = setExecutingSuccess('tx123')
      const newState = executingStateReducer(initialState, action)

      expect(newState.executions.tx123).toEqual({
        status: 'success',
        startedAt: 1234567890,
        completedAt: expect.any(Number),
        executionMethod: ExecutionMethod.WITH_PK,
      })
    })

    it('setExecutingSuccess does nothing if transaction not in executing state', () => {
      const initialState = createMockState()

      const action = setExecutingSuccess('tx-999')
      const newState = executingStateReducer(initialState, action)

      expect(newState.executions['tx-999']).toBeUndefined()
    })

    it('setExecutingError updates executing state to error', () => {
      const initialState: ExecutingStateSlice = {
        executions: {
          tx123: {
            status: 'executing',
            startedAt: 1234567890,
            executionMethod: ExecutionMethod.WITH_RELAY,
          },
        },
      }

      const action = setExecutingError({ txId: 'tx123', error: 'Transaction reverted' })
      const newState = executingStateReducer(initialState, action)

      expect(newState.executions.tx123).toEqual({
        status: 'error',
        startedAt: 1234567890,
        completedAt: expect.any(Number),
        executionMethod: ExecutionMethod.WITH_RELAY,
        error: 'Transaction reverted',
      })
    })

    it('setExecutingError does nothing if transaction not in executing state', () => {
      const initialState = createMockState()

      const action = setExecutingError({ txId: 'tx-999', error: 'Some error' })
      const newState = executingStateReducer(initialState, action)

      expect(newState.executions['tx-999']).toBeUndefined()
    })

    it('clearExecuting removes transaction from executing state', () => {
      const initialState: ExecutingStateSlice = {
        executions: {
          tx123: {
            status: 'success',
            startedAt: 1234567890,
            completedAt: 1234567900,
            executionMethod: ExecutionMethod.WITH_PK,
          },
        },
      }

      const action = clearExecuting('tx123')
      const newState = executingStateReducer(initialState, action)

      expect(newState.executions.tx123).toBeUndefined()
    })
  })

  describe('state lifecycle', () => {
    it('handles full executing lifecycle: start -> success -> clear', () => {
      let state = createMockState()
      const txId = 'tx-lifecycle'

      state = executingStateReducer(state, startExecuting({ txId, executionMethod: ExecutionMethod.WITH_PK }))
      expect(state.executions[txId].status).toBe('executing')

      state = executingStateReducer(state, setExecutingSuccess(txId))
      expect(state.executions[txId].status).toBe('success')
      expect(state.executions[txId].completedAt).toBeDefined()

      state = executingStateReducer(state, clearExecuting(txId))
      expect(state.executions[txId]).toBeUndefined()
    })

    it('handles full executing lifecycle: start -> error -> clear', () => {
      let state = createMockState()
      const txId = 'tx-lifecycle'

      state = executingStateReducer(state, startExecuting({ txId, executionMethod: ExecutionMethod.WITH_RELAY }))
      expect(state.executions[txId].status).toBe('executing')

      state = executingStateReducer(state, setExecutingError({ txId, error: 'Relay failed' }))
      expect(state.executions[txId].status).toBe('error')
      expect(state.executions[txId].error).toBe('Relay failed')

      state = executingStateReducer(state, clearExecuting(txId))
      expect(state.executions[txId]).toBeUndefined()
    })
  })

  describe('selectors', () => {
    it('selectExecutingState returns executing state for given txId', () => {
      const mockState = createMockRootState({
        executions: {
          tx123: {
            status: 'executing',
            startedAt: 1234567890,
            executionMethod: ExecutionMethod.WITH_PK,
          },
        },
      })

      const result = selectExecutingState(mockState, 'tx123')

      expect(result).toEqual({
        status: 'executing',
        startedAt: 1234567890,
        executionMethod: ExecutionMethod.WITH_PK,
      })
    })

    it('selectExecutingState returns undefined for non-existent txId', () => {
      const mockState = createMockRootState()

      const result = selectExecutingState(mockState, 'non-existent')

      expect(result).toBeUndefined()
    })

    it('selectIsExecuting returns true when transaction is executing', () => {
      const mockState = createMockRootState({
        executions: {
          tx123: {
            status: 'executing',
            startedAt: 1234567890,
            executionMethod: ExecutionMethod.WITH_PK,
          },
        },
      })

      expect(selectIsExecuting(mockState, 'tx123')).toBe(true)
    })

    it('selectIsExecuting returns false when transaction is not executing', () => {
      const mockState = createMockRootState({
        executions: {
          tx123: {
            status: 'success',
            startedAt: 1234567890,
            completedAt: 1234567900,
            executionMethod: ExecutionMethod.WITH_PK,
          },
        },
      })

      expect(selectIsExecuting(mockState, 'tx123')).toBe(false)
    })

    it('selectIsExecuting returns false for non-existent txId', () => {
      const mockState = createMockRootState()

      expect(selectIsExecuting(mockState, 'non-existent')).toBe(false)
    })
  })
})
