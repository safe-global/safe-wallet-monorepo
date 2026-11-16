import { _getUniqueQueuedTxs, getQueuedNonces } from '@/hooks/usePreviousNonces'
import { getMockTx } from '@/tests/mocks/transactions'
import { ConflictType } from '@safe-global/store/gateway/types'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'

describe('_getUniqueQueuedTxs', () => {
  it('returns an empty array if input is undefined', () => {
    const result = _getUniqueQueuedTxs()

    expect(result).toEqual([])
  })

  it('returns an empty array if input is an empty array', () => {
    const result = _getUniqueQueuedTxs({ results: [] })

    expect(result).toEqual([])
  })

  it('only returns one transaction per nonce', () => {
    const mockTx = getMockTx({ nonce: 0 })
    const mockTx1 = getMockTx({ nonce: 1 })
    const mockTx2 = getMockTx({ nonce: 1 })

    const mockPage = {
      results: [mockTx, mockTx1, mockTx2],
    }
    const result = _getUniqueQueuedTxs(mockPage)

    expect(result.length).toEqual(2)
  })

  it('includes transactions with reject txs (ConflictType.HAS_NEXT)', () => {
    const mockTx0 = getMockTx({ nonce: 0 })
    const mockTx1 = getMockTx({ nonce: 1 })
    const mockRejectTx1 = getMockTx({ nonce: 1 })
    const mockTx2 = getMockTx({ nonce: 2 })

    // Override conflictType on the queue items (not the transaction)
    const mockTxWithReject = { ...mockTx1, conflictType: ConflictType.HAS_NEXT }
    const mockReject = { ...mockRejectTx1, conflictType: ConflictType.END }

    const mockPage = {
      results: [mockTx0, mockTxWithReject, mockReject, mockTx2],
    }
    const result = _getUniqueQueuedTxs(mockPage)

    // Should return 3 unique nonces: 0, 1, and 2
    expect(result.length).toEqual(3)
    const nonces = result
      .map((tx) => (isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined))
      .filter((nonce): nonce is number => nonce !== undefined)
    expect(nonces).toContain(0)
    expect(nonces).toContain(1)
    expect(nonces).toContain(2)
  })
})

describe('getQueuedNonces', () => {
  it('returns no nonces when there is no queue page', () => {
    expect(getQueuedNonces()).toEqual([])
  })

  it('returns each queued nonce once, in queue order', () => {
    const mockPage = {
      results: [getMockTx({ nonce: 4 }), getMockTx({ nonce: 5 }), getMockTx({ nonce: 5 })],
    }

    expect(getQueuedNonces(mockPage)).toEqual([4, 5])
  })
})
