import { saveTxFlowState, loadTxFlowState, clearTxFlowState } from '../txFlowStorage'

describe('txFlowStorage', () => {
  beforeEach(() => {
    clearTxFlowState()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    clearTxFlowState()
  })

  describe('saveTxFlowState', () => {
    it('should save flow state to session storage', () => {
      const flowType = 'TokenTransfer'
      const step = 1
      const data = { recipient: '0x123', amount: '10' }
      const txId = 'tx-123'

      saveTxFlowState(flowType, step, data, txId)

      const loaded = loadTxFlowState()
      expect(loaded).toMatchObject({
        flowType,
        step,
        data,
        txId,
      })
      expect(loaded?.timestamp).toBeDefined()
    })

    it('should save flow state with txNonce', () => {
      const flowType = 'TokenTransfer'
      const step = 2
      const data = { recipient: '0x456', amount: '20' }
      const txNonce = 5

      saveTxFlowState(flowType, step, data, undefined, txNonce)

      const loaded = loadTxFlowState()
      expect(loaded).toMatchObject({
        flowType,
        step,
        data,
        txNonce,
      })
    })
  })

  describe('loadTxFlowState', () => {
    it('should return null if no state exists', () => {
      const loaded = loadTxFlowState()
      expect(loaded).toBeNull()
    })

    it('should load saved state', () => {
      const flowType = 'TokenTransfer'
      const step = 1
      const data = { recipient: '0x789', amount: '30' }

      saveTxFlowState(flowType, step, data)

      const loaded = loadTxFlowState()
      expect(loaded).toMatchObject({
        flowType,
        step,
        data,
      })
    })

    it('should clear stale state (older than 1 hour)', () => {
      const flowType = 'TokenTransfer'
      const step = 1
      const data = { recipient: '0xabc', amount: '40' }

      saveTxFlowState(flowType, step, data)

      // Fast-forward time by more than 1 hour
      jest.advanceTimersByTime(61 * 60 * 1000)

      const loaded = loadTxFlowState()
      expect(loaded).toBeNull()
    })

    it('should not clear state within 1 hour', () => {
      const flowType = 'TokenTransfer'
      const step = 1
      const data = { recipient: '0xdef', amount: '50' }

      saveTxFlowState(flowType, step, data)

      // Fast-forward time by less than 1 hour
      jest.advanceTimersByTime(30 * 60 * 1000)

      const loaded = loadTxFlowState()
      expect(loaded).toMatchObject({
        flowType,
        step,
        data,
      })
    })
  })

  describe('clearTxFlowState', () => {
    it('should clear saved state', () => {
      const flowType = 'TokenTransfer'
      const step = 1
      const data = { recipient: '0x123', amount: '10' }

      saveTxFlowState(flowType, step, data)
      expect(loadTxFlowState()).not.toBeNull()

      clearTxFlowState()
      expect(loadTxFlowState()).toBeNull()
    })
  })
})
