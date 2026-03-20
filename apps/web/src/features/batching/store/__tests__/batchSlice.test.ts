import { batchSlice, addTx, removeTx, type CallOnlyTxData } from '../batchSlice'
import { OperationType } from '@safe-global/types-kit'

const mockTxData: CallOnlyTxData = {
  to: '0x1234567890abcdef1234567890abcdef12345678',
  value: '0',
  data: '0x',
  operation: OperationType.Call,
}

describe('batchSlice', () => {
  const { reducer } = batchSlice

  describe('addTx', () => {
    it('should add a transaction to the batch', () => {
      const state = reducer({}, addTx({ chainId: '1', safeAddress: '0xsafe', txData: mockTxData }))

      expect(state['1']['0xsafe']).toHaveLength(1)
      expect(state['1']['0xsafe'][0].txData).toEqual(mockTxData)
      expect(state['1']['0xsafe'][0].id).toBeDefined()
      expect(state['1']['0xsafe'][0].timestamp).toBeGreaterThan(0)
    })

    it('should append to existing batch', () => {
      let state = reducer({}, addTx({ chainId: '1', safeAddress: '0xsafe', txData: mockTxData }))
      state = reducer(state, addTx({ chainId: '1', safeAddress: '0xsafe', txData: mockTxData }))

      expect(state['1']['0xsafe']).toHaveLength(2)
    })

    it('should support different chains and safes', () => {
      let state = reducer({}, addTx({ chainId: '1', safeAddress: '0xsafe1', txData: mockTxData }))
      state = reducer(state, addTx({ chainId: '5', safeAddress: '0xsafe2', txData: mockTxData }))

      expect(state['1']['0xsafe1']).toHaveLength(1)
      expect(state['5']['0xsafe2']).toHaveLength(1)
    })
  })

  describe('removeTx', () => {
    it('should remove a transaction by id', () => {
      let state = reducer({}, addTx({ chainId: '1', safeAddress: '0xsafe', txData: mockTxData }))
      const txId = state['1']['0xsafe'][0].id

      state = reducer(state, removeTx({ chainId: '1', safeAddress: '0xsafe', id: txId }))

      expect(state['1']['0xsafe']).toHaveLength(0)
    })

    it('should not affect other transactions', () => {
      let state = reducer({}, addTx({ chainId: '1', safeAddress: '0xsafe', txData: mockTxData }))
      state = reducer(state, addTx({ chainId: '1', safeAddress: '0xsafe', txData: mockTxData }))
      const firstId = state['1']['0xsafe'][0].id

      state = reducer(state, removeTx({ chainId: '1', safeAddress: '0xsafe', id: firstId }))

      expect(state['1']['0xsafe']).toHaveLength(1)
    })

    it('should handle removing from non-existent chain/safe gracefully', () => {
      const state = reducer({}, removeTx({ chainId: '1', safeAddress: '0xsafe', id: 'nonexistent' }))

      expect(state['1']['0xsafe']).toEqual([])
    })
  })
})
