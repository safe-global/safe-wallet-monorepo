import { renderHook } from '@testing-library/react-native'
import type {
  ConflictHeaderQueuedItem,
  TransactionQueuedItem,
  QueuedItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { collectQueuedNonces, flattenPages, useNonce } from './useNonce'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useSafesGetNoncesV1Query: jest.fn(),
}))

jest.mock('@safe-global/store/gateway', () => ({
  useGetPendingTxsInfiniteQuery: jest.fn(),
}))

jest.mock('@/src/hooks/useTransactionType', () => ({
  getTransactionType: () => ({ text: 'Send' }),
}))

const { useSafesGetNoncesV1Query } = jest.requireMock('@safe-global/store/gateway/AUTO_GENERATED/safes')
const { useGetPendingTxsInfiniteQuery } = jest.requireMock('@safe-global/store/gateway')

function makeTxItem(nonce: number, humanDescription?: string): TransactionQueuedItem {
  return {
    type: 'TRANSACTION',
    transaction: {
      id: `tx-${nonce}`,
      txInfo: {
        type: 'Transfer',
        humanDescription: humanDescription ?? null,
      } as TransactionQueuedItem['transaction']['txInfo'],
      timestamp: Date.now(),
      txStatus: 'AWAITING_CONFIRMATIONS',
      executionInfo: { type: 'MULTISIG', nonce, confirmationsRequired: 2, confirmationsSubmitted: 1 },
    },
    conflictType: 'None',
  }
}

function makeConflictHeader(nonce: number): ConflictHeaderQueuedItem {
  return { type: 'CONFLICT_HEADER', nonce }
}

describe('flattenPages', () => {
  it('returns empty array for undefined pages', () => {
    expect(flattenPages(undefined)).toEqual([])
  })

  it('flattens multiple pages into a single array', () => {
    const pages: QueuedItemPage[] = [
      { results: [makeTxItem(1)], count: 1 },
      { results: [makeTxItem(2), makeTxItem(3)], count: 2 },
    ]
    expect(flattenPages(pages)).toHaveLength(3)
  })

  it('handles pages with empty results', () => {
    const pages: QueuedItemPage[] = [{ results: [], count: 0 }]
    expect(flattenPages(pages)).toEqual([])
  })
})

describe('collectQueuedNonces', () => {
  it('returns empty array for empty items', () => {
    expect(collectQueuedNonces([])).toEqual([])
  })

  it('extracts nonces from TRANSACTION items sorted ascending', () => {
    const items = [makeTxItem(5), makeTxItem(3), makeTxItem(7)]
    const result = collectQueuedNonces(items)

    expect(result.map((r) => r.nonce)).toEqual([3, 5, 7])
  })

  it('deduplicates nonces keeping the first occurrence', () => {
    const items = [makeTxItem(3, 'First tx at nonce 3'), makeTxItem(3, 'Second tx at nonce 3'), makeTxItem(5)]
    const result = collectQueuedNonces(items)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ nonce: 3, label: 'First tx at nonce 3' })
    expect(result[1].nonce).toBe(5)
  })

  it('uses conflict header nonce as fallback for transactions without multisig executionInfo', () => {
    const txWithoutMultisig: TransactionQueuedItem = {
      type: 'TRANSACTION',
      transaction: {
        id: 'tx-no-multisig',
        txInfo: { type: 'Transfer', humanDescription: null } as TransactionQueuedItem['transaction']['txInfo'],
        timestamp: Date.now(),
        txStatus: 'AWAITING_CONFIRMATIONS',
        executionInfo: { type: 'MODULE', address: { value: '0x123' } },
      },
      conflictType: 'None',
    }

    const items = [makeConflictHeader(10), txWithoutMultisig]
    const result = collectQueuedNonces(items)

    expect(result).toHaveLength(1)
    expect(result[0].nonce).toBe(10)
  })

  it('skips LABEL items', () => {
    const items = [{ type: 'LABEL' as const, label: 'Next' }, makeTxItem(1)]
    const result = collectQueuedNonces(items)

    expect(result).toHaveLength(1)
    expect(result[0].nonce).toBe(1)
  })

  it('uses humanDescription as label when available', () => {
    const items = [makeTxItem(1, 'Send 1 ETH to alice.eth')]
    const result = collectQueuedNonces(items)

    expect(result[0].label).toBe('Send 1 ETH to alice.eth')
  })

  it('appends "transaction" to label when getTransactionType text lacks it', () => {
    const items = [makeTxItem(1)]
    const result = collectQueuedNonces(items)

    expect(result[0].label).toBe('Send transaction')
  })
})

describe('useNonce', () => {
  const defaultQueueMock = {
    currentData: undefined,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useGetPendingTxsInfiniteQuery.mockReturnValue(defaultQueueMock)
  })

  it('returns API recommendedNonce when there are no queued transactions', () => {
    useSafesGetNoncesV1Query.mockReturnValue({
      data: { recommendedNonce: 5, currentNonce: 5 },
      isLoading: false,
    })

    const { result } = renderHook(() => useNonce('1', '0xSafe'))

    expect(result.current.recommendedNonce).toBe(5)
    expect(result.current.currentNonce).toBe(5)
  })

  it('returns undefined when nonces data is not loaded', () => {
    useSafesGetNoncesV1Query.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { result } = renderHook(() => useNonce('1', '0xSafe'))

    expect(result.current.recommendedNonce).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('passes through API recommendedNonce when queued transactions exist', () => {
    useSafesGetNoncesV1Query.mockReturnValue({
      data: { recommendedNonce: 8, currentNonce: 5 },
      isLoading: false,
    })

    useGetPendingTxsInfiniteQuery.mockReturnValue({
      ...defaultQueueMock,
      currentData: {
        pages: [{ results: [makeTxItem(5), makeTxItem(6), makeTxItem(7)], count: 3 }],
      },
    })

    const { result } = renderHook(() => useNonce('1', '0xSafe'))

    expect(result.current.recommendedNonce).toBe(8)
    expect(result.current.queuedNonces.map((q) => q.nonce)).toEqual([5, 6, 7])
  })

  it('returns queued nonces sorted ascending (lowest to highest)', () => {
    useSafesGetNoncesV1Query.mockReturnValue({
      data: { recommendedNonce: 100, currentNonce: 5 },
      isLoading: false,
    })

    useGetPendingTxsInfiniteQuery.mockReturnValue({
      ...defaultQueueMock,
      currentData: {
        pages: [{ results: [makeTxItem(8), makeTxItem(5), makeTxItem(12), makeTxItem(6)], count: 4 }],
      },
    })

    const { result } = renderHook(() => useNonce('1', '0xSafe'))

    expect(result.current.queuedNonces.map((q) => q.nonce)).toEqual([5, 6, 8, 12])
  })
})
