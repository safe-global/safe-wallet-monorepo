import signingStateReducer, {
  startSigning,
  setSigningSuccess,
  setSigningError,
  clearSigning,
  selectSigningState,
} from './signingStateSlice'
import { RootState } from '@/src/store'

type SigningStateSlice = ReturnType<typeof signingStateReducer>

describe('signingStateSlice', () => {
  const createMockState = (): SigningStateSlice => ({
    signings: {},
  })

  const createMockRootState = (signingState = createMockState()) =>
    ({
      signingState,
    }) as RootState

  describe('reducers', () => {
    it('startSigning adds transaction to signing state', () => {
      const initialState = createMockState()
      const txId = 'tx123'

      const action = startSigning(txId)
      const newState = signingStateReducer(initialState, action)

      expect(newState.signings[txId]).toEqual({
        status: 'signing',
        startedAt: expect.any(Number),
      })
    })

    it('setSigningSuccess updates signing state to success', () => {
      const initialState = {
        signings: {
          tx123: {
            status: 'signing' as const,
            startedAt: 1234567890,
          },
        },
      }

      const action = setSigningSuccess('tx123')
      const newState = signingStateReducer(initialState, action)

      expect(newState.signings.tx123).toEqual({
        status: 'success',
        startedAt: 1234567890,
        completedAt: expect.any(Number),
      })
    })

    it('setSigningSuccess does nothing if transaction not in signing state', () => {
      const initialState = createMockState()

      const action = setSigningSuccess('tx-999')
      const newState = signingStateReducer(initialState, action)

      expect(newState.signings['tx-999']).toBeUndefined()
    })

    it('setSigningError updates signing state to error', () => {
      const initialState = {
        signings: {
          tx123: {
            status: 'signing' as const,
            startedAt: 1234567890,
          },
        },
      }

      const action = setSigningError({ txId: 'tx123', error: 'Network timeout' })
      const newState = signingStateReducer(initialState, action)

      expect(newState.signings.tx123).toEqual({
        status: 'error',
        startedAt: 1234567890,
        completedAt: expect.any(Number),
        error: 'Network timeout',
      })
    })

    it('setSigningError does nothing if transaction not in signing state', () => {
      const initialState = createMockState()

      const action = setSigningError({ txId: 'tx-999', error: 'Some error' })
      const newState = signingStateReducer(initialState, action)

      expect(newState.signings['tx-999']).toBeUndefined()
    })

    it('clearSigning removes transaction from signing state', () => {
      const initialState = {
        signings: {
          tx123: {
            status: 'success' as const,
            startedAt: 1234567890,
            completedAt: 1234567900,
          },
        },
      }

      const action = clearSigning('tx123')
      const newState = signingStateReducer(initialState, action)

      expect(newState.signings.tx123).toBeUndefined()
    })
  })

  describe('state lifecycle', () => {
    it('handles full signing lifecycle: start -> success -> clear', () => {
      let state = createMockState()
      const txId = 'tx-lifecycle'

      // Start signing
      state = signingStateReducer(state, startSigning(txId))
      expect(state.signings[txId].status).toBe('signing')

      // Success
      state = signingStateReducer(state, setSigningSuccess(txId))
      expect(state.signings[txId].status).toBe('success')
      expect(state.signings[txId].completedAt).toBeDefined()

      // Clear
      state = signingStateReducer(state, clearSigning(txId))
      expect(state.signings[txId]).toBeUndefined()
    })

    it('handles full signing lifecycle: start -> error -> clear', () => {
      let state = createMockState()
      const txId = 'tx-lifecycle'

      // Start signing
      state = signingStateReducer(state, startSigning(txId))
      expect(state.signings[txId].status).toBe('signing')

      // Error
      state = signingStateReducer(state, setSigningError({ txId, error: 'Failed' }))
      expect(state.signings[txId].status).toBe('error')
      expect(state.signings[txId].error).toBe('Failed')

      // Clear
      state = signingStateReducer(state, clearSigning(txId))
      expect(state.signings[txId]).toBeUndefined()
    })
  })

  describe('selectors', () => {
    it('selectSigningState returns signing state for given txId', () => {
      const mockState = createMockRootState({
        signings: {
          tx123: {
            status: 'signing',
            startedAt: 1234567890,
          },
        },
      })

      const result = selectSigningState(mockState, 'tx123')

      expect(result).toEqual({
        status: 'signing',
        startedAt: 1234567890,
      })
    })

    it('selectSigningState returns undefined for non-existent txId', () => {
      const mockState = createMockRootState()

      const result = selectSigningState(mockState, 'non-existent')

      expect(result).toBeUndefined()
    })
  })
})
