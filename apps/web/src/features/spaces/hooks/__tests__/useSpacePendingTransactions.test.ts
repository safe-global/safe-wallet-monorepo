import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useSpacePendingTransactions } from '../useSpacePendingTransactions'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import * as transactionsService from '@/services/transactions'
import * as txList from '@/utils/tx-list'

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(),
}))
jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))
jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))
jest.mock('@/services/transactions', () => ({
  getTransactionQueue: jest.fn(),
}))
jest.mock('@/utils/tx-list', () => ({
  getLatestTransactions: jest.fn(),
}))

import { useCurrentSpaceId } from '../useCurrentSpaceId'
import { useAppSelector } from '@/store'

const createQueuedItem = (
  timestamp: number,
  overrides: Partial<TransactionQueuedItem> = {},
): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  transaction: {
    id: faker.string.uuid(),
    txHash: faker.string.hexadecimal({ length: 64 }),
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
    ...overrides.transaction,
  },
  conflictType: 'None',
  ...overrides,
})

const SAFE_ADDRESS_1 = faker.finance.ethereumAddress()
const SAFE_ADDRESS_2 = faker.finance.ethereumAddress()

describe('useSpacePendingTransactions', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue('1')
    ;(useAppSelector as jest.Mock).mockReturnValue(true)
    jest.spyOn(spacesQueries, 'useSpaceSafesGetV1Query').mockReturnValue({
      currentData: {
        safes: { '1': [SAFE_ADDRESS_1], '137': [SAFE_ADDRESS_2] },
      },
      refetch: jest.fn(),
    })
  })

  it('should return empty transactions when user is not signed in', async () => {
    ;(useAppSelector as jest.Mock).mockReturnValue(false)
    jest.spyOn(spacesQueries, 'useSpaceSafesGetV1Query').mockReturnValue({
      currentData: undefined,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.transactions).toEqual([])
      expect(result.current.count).toBe(0)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should return empty transactions when there is no space id', async () => {
    ;(useCurrentSpaceId as jest.Mock).mockReturnValue(undefined)
    jest.spyOn(spacesQueries, 'useSpaceSafesGetV1Query').mockReturnValue({
      currentData: undefined,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.transactions).toEqual([])
      expect(result.current.count).toBe(0)
    })
  })

  it('should return empty transactions when space has no safes', async () => {
    jest.spyOn(spacesQueries, 'useSpaceSafesGetV1Query').mockReturnValue({
      currentData: { safes: {} },
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.transactions).toEqual([])
      expect(result.current.count).toBe(0)
    })
  })

  it('should fetch and merge transactions from multiple safes', async () => {
    const tx1 = createQueuedItem(1000)
    const tx2 = createQueuedItem(2000)

    ;(transactionsService.getTransactionQueue as jest.Mock)
      .mockResolvedValueOnce({ results: [tx1] })
      .mockResolvedValueOnce({ results: [tx2] })
    ;(txList.getLatestTransactions as jest.Mock).mockImplementation((results) =>
      results.filter((r: TransactionQueuedItem) => r.type === 'TRANSACTION'),
    )

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.transactions).toHaveLength(2)
      expect(result.current.count).toBe(2)
    })
  })

  it('should sort transactions by timestamp ascending (oldest first)', async () => {
    const oldTx = createQueuedItem(1000)
    const recentTx = createQueuedItem(3000)
    const middleTx = createQueuedItem(2000)

    ;(transactionsService.getTransactionQueue as jest.Mock)
      .mockResolvedValueOnce({ results: [recentTx, oldTx] })
      .mockResolvedValueOnce({ results: [middleTx] })
    ;(txList.getLatestTransactions as jest.Mock).mockImplementation((results) =>
      results.filter((r: TransactionQueuedItem) => r.type === 'TRANSACTION'),
    )

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      const timestamps = result.current.transactions.map((tx) => tx.transaction.timestamp)
      expect(timestamps).toEqual([1000, 2000, 3000])
    })
  })

  it('should respect the limit parameter', async () => {
    const tx1 = createQueuedItem(1000)
    const tx2 = createQueuedItem(2000)
    const tx3 = createQueuedItem(3000)

    ;(transactionsService.getTransactionQueue as jest.Mock)
      .mockResolvedValueOnce({ results: [tx1, tx2] })
      .mockResolvedValueOnce({ results: [tx3] })
    ;(txList.getLatestTransactions as jest.Mock).mockImplementation((results) =>
      results.filter((r: TransactionQueuedItem) => r.type === 'TRANSACTION'),
    )

    const { result } = renderHook(() => useSpacePendingTransactions(2))

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(2)
      expect(result.current.transactions[0].transaction.timestamp).toBe(1000)
      expect(result.current.transactions[1].transaction.timestamp).toBe(2000)
    })
  })

  it('should attach safeAddress and chainId to each transaction', async () => {
    const tx1 = createQueuedItem(1000)
    const tx2 = createQueuedItem(2000)

    ;(transactionsService.getTransactionQueue as jest.Mock)
      .mockResolvedValueOnce({ results: [tx1] })
      .mockResolvedValueOnce({ results: [tx2] })
    ;(txList.getLatestTransactions as jest.Mock).mockImplementation((results) =>
      results.filter((r: TransactionQueuedItem) => r.type === 'TRANSACTION'),
    )

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.transactions[0]).toHaveProperty('safeAddress', SAFE_ADDRESS_1)
      expect(result.current.transactions[0]).toHaveProperty('chainId', '1')
      expect(result.current.transactions[1]).toHaveProperty('safeAddress', SAFE_ADDRESS_2)
      expect(result.current.transactions[1]).toHaveProperty('chainId', '137')
    })
  })

  it('should set error when fetching fails', async () => {
    ;(transactionsService.getTransactionQueue as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSpacePendingTransactions())

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load pending transactions')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.transactions).toEqual([])
    })
  })

  it('should pass correct cursor with limit to getTransactionQueue', async () => {
    ;(transactionsService.getTransactionQueue as jest.Mock).mockResolvedValue({ results: [] })
    ;(txList.getLatestTransactions as jest.Mock).mockReturnValue([])

    renderHook(() => useSpacePendingTransactions(5))

    await waitFor(() => {
      expect(transactionsService.getTransactionQueue).toHaveBeenCalledWith('1', SAFE_ADDRESS_1, {
        trusted: true,
        cursor: 'limit=5&offset=0',
      })
    })
  })
})
