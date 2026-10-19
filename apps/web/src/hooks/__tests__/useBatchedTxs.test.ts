import { ConflictType, TransactionListItemType } from '@safe-global/store/gateway/types'
import type {
  MultisigExecutionInfo,
  ModuleTransaction,
  ConflictHeaderQueuedItem,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getBatchableTransactions } from '@/hooks/useBatchedTxs'
import { defaultTx, getMockTx } from '@/tests/mocks/transactions'

describe('getBatchableTransactions', () => {
  it('should return an empty array if no transactions are passed', () => {
    const result = getBatchableTransactions([], 0)

    expect(result).toStrictEqual([])
  })

  it('should include a tx with enough confirmations', () => {
    const mockTx: ModuleTransaction = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 0,
          confirmationsRequired: 2,
          confirmationsSubmitted: 2,
        } as MultisigExecutionInfo,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.NONE,
    }
    const result = getBatchableTransactions([mockTx], 0)

    expect(result.length).toBe(1)
    expect(result).toStrictEqual([mockTx])
  })

  it('should ignore a tx with missing confirmations', () => {
    const mockTx: ModuleTransaction = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 0,
          confirmationsRequired: 2,
          confirmationsSubmitted: 1,
        } as MultisigExecutionInfo,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.NONE,
    }
    const result = getBatchableTransactions([mockTx], 0)

    expect(result.length).toBe(0)
    expect(result).toStrictEqual([])
  })

  it('should pick the newer tx of a group', () => {
    const mockTx: ModuleTransaction = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 0,
          confirmationsRequired: 2,
          confirmationsSubmitted: 2,
        } as MultisigExecutionInfo,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.NONE,
    }

    const mockConflict: ConflictHeaderQueuedItem = {
      type: TransactionListItemType.CONFLICT_HEADER,
      nonce: 1,
    }

    const mockTx1: TransactionQueuedItem = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 1,
          confirmationsRequired: 2,
          confirmationsSubmitted: 2,
        } as MultisigExecutionInfo,
        timestamp: 1,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.HAS_NEXT,
    }

    const mockTx2: TransactionQueuedItem = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 1,
          confirmationsRequired: 2,
          confirmationsSubmitted: 2,
        } as MultisigExecutionInfo,
        timestamp: 2,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.END,
    }

    const result = getBatchableTransactions([mockTx, mockConflict, mockTx1, mockTx2], 0)

    expect(result.length).toBe(2)
    expect(result).toStrictEqual([mockTx, mockTx2])
  })

  it('should ignore a tx with out of order nonce', () => {
    const mockTx: ModuleTransaction = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 0,
          confirmationsRequired: 2,
          confirmationsSubmitted: 2,
        } as MultisigExecutionInfo,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.NONE,
    }

    const mockTx1: ModuleTransaction = {
      transaction: {
        ...defaultTx,
        executionInfo: {
          ...defaultTx.executionInfo,
          nonce: 2,
          confirmationsRequired: 2,
          confirmationsSubmitted: 2,
        } as MultisigExecutionInfo,
      },
      type: TransactionListItemType.TRANSACTION,
      conflictType: ConflictType.NONE,
    }

    const result = getBatchableTransactions([mockTx, mockTx1], 0)

    expect(result.length).toBe(1)
    expect(result).toStrictEqual([mockTx])
  })

  it('should return a maximum of 20 txs', () => {
    const mockTx = getMockTx({ nonce: 0 })
    const mockTx1 = getMockTx({ nonce: 1 })
    const mockTx2 = getMockTx({ nonce: 2 })
    const mockTx3 = getMockTx({ nonce: 3 })
    const mockTx4 = getMockTx({ nonce: 4 })
    const mockTx5 = getMockTx({ nonce: 5 })
    const mockTx6 = getMockTx({ nonce: 6 })
    const mockTx7 = getMockTx({ nonce: 7 })
    const mockTx8 = getMockTx({ nonce: 8 })
    const mockTx9 = getMockTx({ nonce: 9 })
    const mockTx10 = getMockTx({ nonce: 10 })
    const mockTx11 = getMockTx({ nonce: 11 })
    const mockTx12 = getMockTx({ nonce: 12 })
    const mockTx13 = getMockTx({ nonce: 13 })
    const mockTx14 = getMockTx({ nonce: 14 })
    const mockTx15 = getMockTx({ nonce: 15 })
    const mockTx16 = getMockTx({ nonce: 16 })
    const mockTx17 = getMockTx({ nonce: 17 })
    const mockTx18 = getMockTx({ nonce: 18 })
    const mockTx19 = getMockTx({ nonce: 19 })
    const mockTx20 = getMockTx({ nonce: 20 })

    const result = getBatchableTransactions(
      [
        mockTx,
        mockTx1,
        mockTx2,
        mockTx3,
        mockTx4,
        mockTx5,
        mockTx6,
        mockTx7,
        mockTx8,
        mockTx9,
        mockTx10,
        mockTx11,
        mockTx12,
        mockTx13,
        mockTx14,
        mockTx15,
        mockTx16,
        mockTx17,
        mockTx18,
        mockTx19,
        mockTx20,
      ],
      0,
    )

    expect(result.length).toBe(20)
    expect(result).toStrictEqual([
      mockTx,
      mockTx1,
      mockTx2,
      mockTx3,
      mockTx4,
      mockTx5,
      mockTx6,
      mockTx7,
      mockTx8,
      mockTx9,
      mockTx10,
      mockTx11,
      mockTx12,
      mockTx13,
      mockTx14,
      mockTx15,
      mockTx16,
      mockTx17,
      mockTx18,
      mockTx19,
    ])
  })

  it.each([
    { signatures: [2, 2, 1], expectedNonces: [0, 1] },
    { signatures: [2, 2, 1, 2], expectedNonces: [0, 1] },
  ])(
    'should stop at the first tx with missing signatures: $signatures of 2 → nonces $expectedNonces',
    ({ signatures, expectedNonces }) => {
      const txs = signatures.map((confirmationsSubmitted, nonce) => {
        const tx = getMockTx({ nonce })
        tx.transaction.executionInfo = {
          ...tx.transaction.executionInfo,
          confirmationsRequired: 2,
          confirmationsSubmitted,
        } as MultisigExecutionInfo
        return tx
      })

      const result = getBatchableTransactions(txs, 0)

      expect(result.map((tx) => (tx.transaction.executionInfo as MultisigExecutionInfo).nonce)).toEqual(expectedNonces)
    },
  )
})
