import {
  TransactionListItemType,
  DetailedExecutionInfoType,
  LabelValue,
  ConflictType,
} from '@safe-global/store/gateway/types'

import type {
  LabelQueuedItem,
  ModuleTransaction,
  QueuedItemPage,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type PendingTx } from '@/store/pendingTxsSlice'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { act, renderHook } from '@/tests/test-utils'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { filterUntrustedQueue, getNextTransactions, useHasPendingTxs, usePendingTxsQueue } from '../usePendingTxs'
import { isLabelListItem } from '@/utils/transaction-guards'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'

const mockQueue = <QueuedItemPage>{
  next: undefined,
  previous: undefined,
  results: [
    {
      type: TransactionListItemType.LABEL,
      label: LabelValue.Next,
    },
    {
      type: 'TRANSACTION',
      transaction: {
        id: 'multisig_123',
        executionInfo: {
          confirmationsSubmitted: 0,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      },
      conflictType: ConflictType.NONE,
    },
    {
      type: 'TRANSACTION',
      transaction: {
        id: 'multisig_456',
        executionInfo: {
          confirmationsSubmitted: 0,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      },
      conflictType: ConflictType.NONE,
    },
  ],
}

const mockQueueWithQueued = <QueuedItemPage>{
  next: undefined,
  previous: undefined,
  results: [
    ...mockQueue.results,
    {
      type: TransactionListItemType.LABEL,
      label: LabelValue.Queued,
    },
    {
      type: 'TRANSACTION',
      transaction: {
        id: 'multisig_789',
        executionInfo: {
          confirmationsSubmitted: 0,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      },
      conflictType: ConflictType.NONE,
    },
  ],
}

const mockQueueWithConflictHeaders = <QueuedItemPage>{
  next: undefined,
  previous: undefined,
  results: [
    {
      type: TransactionListItemType.LABEL,
      label: LabelValue.Next,
    },
    {
      type: TransactionListItemType.CONFLICT_HEADER,
      nonce: 2,
    },
    {
      type: 'TRANSACTION',
      transaction: {
        id: 'multisig_123',
        executionInfo: {
          confirmationsSubmitted: 0,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      },
    },
    {
      type: 'TRANSACTION',
      transaction: {
        id: 'multisig_456',
        executionInfo: {
          confirmationsSubmitted: 0,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      },
    },
  ],
}

const mockQueueWithSignedTxsOnly = <QueuedItemPage>{
  next: undefined,
  previous: undefined,
  results: [
    {
      type: TransactionListItemType.LABEL,
      label: LabelValue.Next,
    },
    {
      type: 'TRANSACTION',
      transaction: {
        id: 'multisig_456',
        executionInfo: {
          confirmationsSubmitted: 1,
          confirmationsRequired: 1,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      },
      conflictType: ConflictType.NONE,
    },
  ],
}

describe('getNextTransactions', () => {
  it('should return all transactions up to the "Queued" label', () => {
    const result = getNextTransactions(mockQueueWithQueued)

    expect(result.results).toStrictEqual(mockQueue.results)
  })

  it('should return all transactions if there is no "Queued" label', () => {
    const mockQueueWithoutQueuedLabel = {
      ...mockQueueWithQueued,
      results: (mockQueueWithQueued.results as Array<any>).filter(
        (item) => isLabelListItem(item) && item.label !== LabelValue.Queued,
      ),
    }

    const result = getNextTransactions(mockQueueWithoutQueuedLabel)

    expect(result.results).toStrictEqual(mockQueueWithoutQueuedLabel.results)
  })
})

describe('filterUntrustedQueue', () => {
  it('should remove transactions that are not pending', () => {
    const mockPendingIds = ['multisig_123']

    const result = filterUntrustedQueue(mockQueue, mockPendingIds)

    expect(result?.results.length).toEqual(2)
  })

  it('should rename the first label to Pending', () => {
    const mockPendingIds = ['multisig_123']

    const result = filterUntrustedQueue(mockQueue, mockPendingIds)

    expect(result?.results[0]).toEqual({ type: 'LABEL', label: 'Pending' })
  })

  it('should remove all conflict headers', () => {
    const mockPendingIds = ['multisig_123']

    const result = filterUntrustedQueue(mockQueueWithConflictHeaders, mockPendingIds)

    expect(result?.results[0]).toEqual({ type: 'LABEL', label: 'Pending' })
    expect(result?.results.length).toEqual(2)
    expect(result?.results[1].type).not.toEqual(TransactionListItemType.CONFLICT_HEADER)
  })

  it('should remove all transactions that are signed', () => {
    const mockPendingIds = ['multisig_123', 'multisig_789']
    const mockQueueWithSignedTxs = { ...mockQueue }

    mockQueueWithSignedTxs.results.push({
      type: TransactionListItemType.TRANSACTION,
      transaction: {
        id: 'multisig_789',
        executionInfo: {
          confirmationsSubmitted: 1,
          confirmationsRequired: 1,
          type: DetailedExecutionInfoType.MULTISIG,
        },
      } as unknown as Transaction,
      conflictType: ConflictType.NONE,
    })

    const result = filterUntrustedQueue(mockQueueWithSignedTxs, mockPendingIds)

    expect(result?.results.length).toEqual(2)
    expect(result?.results[2]).not.toEqual(mockQueueWithSignedTxs.results[2])
  })
})

describe('usePendingTxsQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    // Setup MSW handler for transaction queue endpoint
    server.use(
      http.get<{ chainId: string; safeAddress: string }>(
        `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`,
        () => {
          return HttpResponse.json(mockQueue)
        },
      ),
    )

    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfoBuilder().build(),
        nonce: 100,
        threshold: 1,
        owners: [{ value: '0x123' }],
        chainId: '5',
      },
      safeAddress: '0x0000000000000000000000000000000000000001',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))
  })

  it('should return the pending txs queue for unsigned transactions', async () => {
    const { result } = renderHook(() => usePendingTxsQueue(), {
      initialReduxState: {
        pendingTxs: {
          multisig_123: {
            chainId: '5',
            safeAddress: '0x0000000000000000000000000000000000000001',
            txHash: 'tx123',
          } as PendingTx,
        },
      },
    })

    expect(result?.current.loading).toBe(true)

    await act(() => Promise.resolve(true))

    const resultItems = result?.current.page?.results

    expect(result?.current.loading).toBe(false)
    expect(result?.current.page).toBeDefined()
    expect(resultItems?.length).toBe(2)
    expect((resultItems?.[0] as LabelQueuedItem).label).toBe('Pending')
    expect((resultItems?.[1] as ModuleTransaction).transaction.id).toBe('multisig_123')
  })

  it('should return undefined if none of the returned txs are pending', async () => {
    const { result } = renderHook(() => usePendingTxsQueue(), {
      initialReduxState: {
        pendingTxs: {
          multisig_567: {
            chainId: '5',
            safeAddress: '0x0000000000000000000000000000000000000001',
            txHash: 'tx567',
          } as PendingTx,
        },
      },
    })

    expect(result?.current.loading).toBe(true)

    await act(() => Promise.resolve(true))

    expect(result?.current.loading).toBe(false)
    expect(result?.current.page).toBeUndefined()
  })

  it('should return undefined if none of the pending txs are unsigned', async () => {
    server.use(
      http.get(
        `${GATEWAY_URL}/v1/chains/5/safes/0x0000000000000000000000000000000000000001/transactions/queued`,
        () => {
          return HttpResponse.json(mockQueueWithSignedTxsOnly)
        },
      ),
    )

    const { result } = renderHook(() => usePendingTxsQueue(), {
      initialReduxState: {
        pendingTxs: {
          multisig_456: {
            chainId: '5',
            safeAddress: '0x0000000000000000000000000000000000000001',
            txHash: 'tx567',
          } as PendingTx,
        },
      },
    })

    expect(result?.current.loading).toBe(true)

    await act(() => Promise.resolve(true))

    expect(result?.current.loading).toBe(false)
    expect(result?.current.page).toBeUndefined()
  })

  it('should remove all conflict headers', async () => {
    server.use(
      http.get(
        `${GATEWAY_URL}/v1/chains/5/safes/0x0000000000000000000000000000000000000001/transactions/queued`,
        () => {
          return HttpResponse.json(mockQueueWithConflictHeaders)
        },
      ),
    )

    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: {
        ...extendedSafeInfoBuilder().build(),
        nonce: 100,
        threshold: 1,
        owners: [{ value: '0x123' }],
        chainId: '5',
      },
      safeAddress: '0x0000000000000000000000000000000000000001',
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    const { result } = renderHook(() => usePendingTxsQueue(), {
      initialReduxState: {
        pendingTxs: {
          multisig_123: {
            chainId: '5',
            safeAddress: '0x0000000000000000000000000000000000000001',
            txHash: 'tx123',
          } as PendingTx,
        },
      },
    })

    expect(result?.current.loading).toBe(true)

    await act(() => Promise.resolve(true))

    const resultItems = result?.current.page?.results

    expect(result?.current.loading).toBe(false)
    expect(result?.current.page).toBeDefined()
    expect(resultItems?.length).toBe(2)
    expect((resultItems?.[0] as LabelQueuedItem).label).toBe('Pending')
    expect((resultItems?.[1] as ModuleTransaction).transaction.id).toBe('multisig_123')
  })
})

describe('useHasPendingTxs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should return true if there are pending txs', () => {
    const { result } = renderHook(() => useHasPendingTxs(), {
      initialReduxState: {
        pendingTxs: {
          multisig_123: {
            chainId: '5',
            safeAddress: '0x0000000000000000000000000000000000000001',
            txHash: 'tx123',
          } as PendingTx,

          multisig_456: {
            chainId: '5',
            safeAddress: '0x0000000000000000000000000000000000000002',
            txHash: 'tx456',
          } as PendingTx,
        },
      },
    })

    expect(result?.current).toBe(true)
  })

  it('should return falseif there are no pending txs for the current chain', () => {
    const { result } = renderHook(() => useHasPendingTxs(), {
      initialReduxState: {
        pendingTxs: {
          multisig_789: {
            chainId: '1',
            safeAddress: '0x0000000000000000000000000000000000000001',
            txHash: 'tx789',
          } as PendingTx,
        },
      },
    })

    expect(result?.current).toBe(false)
  })
})
