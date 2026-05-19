import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSpacePendingTransactions } from '../useSpacePendingTransactions'

const mockUseCurrentSpaceId = jest.fn()
const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseSpaceTransactionsGetTransactionQueueV1Query = jest.fn()
const mockUseAppSelector = jest.fn()

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
  useSpaceTransactionsGetTransactionQueueV1Query: (...args: unknown[]) =>
    mockUseSpaceTransactionsGetTransactionQueueV1Query(...args),
}))

jest.mock('@/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

const SAFE_1 = '0xa77de01e157f9f57c7c4a326eee9c4874d0598b6'
const SAFE_2 = '0xb4ad06d5514d68e55655b3e30a8cc4c5ab5e798a'
const SAFE_UNKNOWN = '0x0000000000000000000000000000000000000000'

const refetch = jest.fn()

const txHash = (): string => `0x${faker.string.hexadecimal({ length: 64, casing: 'lower', prefix: '' })}`

const createQueuedItem = (
  safeAddress: string,
  timestamp: number,
  overrides: Partial<TransactionQueuedItem['transaction']> = {},
): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  transaction: {
    id: `multisig_${safeAddress}_${txHash()}`,
    txHash: txHash(),
    timestamp,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Custom',
      to: { value: faker.finance.ethereumAddress() },
      methodName: null,
      dataSize: '0',
      isCancellation: false,
      humanDescription: null,
    },
    executionInfo: {
      type: 'MULTISIG',
      nonce: faker.number.int({ min: 1, max: 100 }),
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
    ...overrides,
  } as TransactionQueuedItem['transaction'],
  conflictType: 'None',
})

const mockSpaceSafes = (safes: Record<string, string[]>): void => {
  mockUseSpaceSafesGetV1Query.mockReturnValue({ currentData: { safes }, isFetching: false })
}

const mockQueue = (
  results: TransactionQueuedItem[] | undefined,
  opts: { isFetching?: boolean; error?: unknown } = {},
): void => {
  mockUseSpaceTransactionsGetTransactionQueueV1Query.mockReturnValue({
    currentData: results ? { count: results.length, next: null, previous: null, results } : undefined,
    isFetching: opts.isFetching ?? false,
    error: opts.error,
    refetch,
  })
}

describe('useSpacePendingTransactions', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockUseAppSelector.mockReturnValue(true)
    mockUseCurrentSpaceId.mockReturnValue('42')
    mockSpaceSafes({ '1': [SAFE_1], '137': [SAFE_2] })
    mockQueue([])
  })

  it('returns empty list when the queue response is empty', () => {
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('reflects loading state from the queue query', () => {
    mockQueue(undefined, { isFetching: true })
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.isLoading).toBe(true)
  })

  it('attaches safeAddress and chainId by parsing tx id and looking up the space safes map', () => {
    mockQueue([createQueuedItem(SAFE_1, 1000), createQueuedItem(SAFE_2, 2000)])
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.transactions[0]).toMatchObject({ safeAddress: SAFE_1, chainId: '1' })
    expect(result.current.transactions[1]).toMatchObject({ safeAddress: SAFE_2, chainId: '137' })
  })

  it('matches safeAddress lookup case-insensitively', () => {
    mockSpaceSafes({ '1': [SAFE_1.toUpperCase()] })
    mockQueue([createQueuedItem(SAFE_1, 1000)])
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions[0].chainId).toBe('1')
  })

  it('falls back to an empty chainId when the safe is not in the space lookup', () => {
    mockQueue([createQueuedItem(SAFE_UNKNOWN, 1000)])
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].chainId).toBe('')
    expect(result.current.transactions[0].safeAddress).toBe(SAFE_UNKNOWN)
  })

  it('sorts transactions by timestamp ascending', () => {
    mockQueue([createQueuedItem(SAFE_1, 3000), createQueuedItem(SAFE_2, 1000), createQueuedItem(SAFE_1, 2000)])
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions.map((tx) => tx.transaction.timestamp)).toEqual([1000, 2000, 3000])
  })

  it('respects the limit parameter when slicing results', () => {
    mockQueue([createQueuedItem(SAFE_1, 1000), createQueuedItem(SAFE_2, 2000), createQueuedItem(SAFE_1, 3000)])
    const { result } = renderHook(() => useSpacePendingTransactions(2))
    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.transactions.map((tx) => tx.transaction.timestamp)).toEqual([1000, 2000])
  })

  it('skips non-TRANSACTION queued items', () => {
    const tx = createQueuedItem(SAFE_1, 1000)
    const label = { type: 'LABEL', label: 'Next' } as unknown as TransactionQueuedItem
    const conflict = { type: 'CONFLICT_HEADER', nonce: 1 } as unknown as TransactionQueuedItem
    mockQueue([label, tx, conflict])
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].transaction.timestamp).toBe(1000)
  })

  it('skips items whose id does not match the multisig_<addr>_<hash> shape', () => {
    const tx = createQueuedItem(SAFE_1, 1000)
    const malformed = {
      ...createQueuedItem(SAFE_2, 2000),
      transaction: { ...createQueuedItem(SAFE_2, 2000).transaction, id: 'not-a-multisig-id' },
    }
    mockQueue([tx, malformed])
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0].safeAddress).toBe(SAFE_1)
  })

  it('surfaces an error message when the queue query fails', () => {
    mockQueue(undefined, { error: { status: 500, data: 'boom' } })
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.error).toBe('Failed to load pending transactions')
    expect(result.current.transactions).toEqual([])
  })

  it('passes the cursor with the right limit to the queue query', () => {
    renderHook(() => useSpacePendingTransactions(5))
    expect(mockUseSpaceTransactionsGetTransactionQueueV1Query).toHaveBeenCalledWith(
      { spaceId: 42, cursor: 'limit=5&offset=0' },
      { skip: false },
    )
  })

  it('skips both queries when the user is not signed in', () => {
    mockUseAppSelector.mockReturnValue(false)
    renderHook(() => useSpacePendingTransactions())
    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 42 }, { skip: true })
    expect(mockUseSpaceTransactionsGetTransactionQueueV1Query).toHaveBeenCalledWith(
      { spaceId: 42, cursor: 'limit=3&offset=0' },
      { skip: true },
    )
  })

  it('skips both queries when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(undefined)
    renderHook(() => useSpacePendingTransactions())
    const safesCall = mockUseSpaceSafesGetV1Query.mock.calls[0][1]
    const queueCall = mockUseSpaceTransactionsGetTransactionQueueV1Query.mock.calls[0][1]
    expect(safesCall).toEqual({ skip: true })
    expect(queueCall).toEqual({ skip: true })
  })

  it('exposes refetch from the queue query', () => {
    const { result } = renderHook(() => useSpacePendingTransactions())
    expect(result.current.refetch).toBe(refetch)
  })
})
