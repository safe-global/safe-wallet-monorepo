import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { renderHook, waitFor } from '@/tests/test-utils'
import { multisigTransactionBuilder, queuedTransactionItem } from '@/tests/builders/queuedTransaction'
import { usePerSafePendingTransactions } from '../usePerSafePendingTransactions'

jest.mock('../useSpaceSafesWithQueue', () => ({
  useSpaceSafesWithQueue: jest.fn(),
}))

const mockUseSpaceSafesWithQueue = jest.requireMock('../useSpaceSafesWithQueue').useSpaceSafesWithQueue as jest.Mock

const SAFE_1 = faker.finance.ethereumAddress()
const SAFE_2 = faker.finance.ethereumAddress()
const CHAIN_1 = faker.string.numeric({ length: 3, allowLeadingZeros: false })
const CHAIN_2 = faker.string.numeric({ length: 4, allowLeadingZeros: false })

const queuedItemAt = (timestamp: number) =>
  queuedTransactionItem(multisigTransactionBuilder().with({ timestamp }).build())

const respondWithSafeQueues = (queues: Record<string, QueuedItemPage['results']> | null) => {
  const requests: URL[] = []
  server.use(
    http.get<{ chainId: string; address: string }>(
      `${GATEWAY_URL}/v1/chains/:chainId/safes/:address/transactions/queued`,
      ({ request, params }) => {
        requests.push(new URL(request.url))
        if (!queues) return new HttpResponse(null, { status: 500 })
        const results = queues[`${params.chainId}:${params.address}`] ?? []
        return HttpResponse.json<QueuedItemPage>({ count: results.length, next: null, previous: null, results })
      },
    ),
  )
  return requests
}

describe('usePerSafePendingTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpaceSafesWithQueue.mockReturnValue({
      safesWithQueue: [
        { chainId: CHAIN_1, address: SAFE_1 },
        { chainId: CHAIN_2, address: SAFE_2 },
      ],
      isLoading: false,
    })
  })

  it('returns no transactions when no Safe has a queue', async () => {
    mockUseSpaceSafesWithQueue.mockReturnValue({ safesWithQueue: [], isLoading: false })

    const { result } = renderHook(() => usePerSafePendingTransactions())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.transactions).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('reports loading while the Safes with a queue load', () => {
    mockUseSpaceSafesWithQueue.mockReturnValue({ safesWithQueue: [], isLoading: true })

    const { result } = renderHook(() => usePerSafePendingTransactions())

    expect(result.current.isLoading).toBe(true)
  })

  it('merges the queues of every Safe', async () => {
    respondWithSafeQueues({
      [`${CHAIN_1}:${SAFE_1}`]: [queuedItemAt(1000)],
      [`${CHAIN_2}:${SAFE_2}`]: [queuedItemAt(2000)],
    })

    const { result } = renderHook(() => usePerSafePendingTransactions())

    await waitFor(() => expect(result.current.transactions).toHaveLength(2))
    expect(result.current.count).toBe(2)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns the transactions oldest first', async () => {
    respondWithSafeQueues({
      [`${CHAIN_1}:${SAFE_1}`]: [queuedItemAt(3000), queuedItemAt(1000)],
      [`${CHAIN_2}:${SAFE_2}`]: [queuedItemAt(2000)],
    })

    const { result } = renderHook(() => usePerSafePendingTransactions())

    await waitFor(() => expect(result.current.transactions).toHaveLength(3))
    expect(result.current.transactions.map((tx) => tx.transaction.timestamp)).toEqual([1000, 2000, 3000])
  })

  it('returns no more transactions than the limit', async () => {
    respondWithSafeQueues({
      [`${CHAIN_1}:${SAFE_1}`]: [queuedItemAt(1000), queuedItemAt(2000)],
      [`${CHAIN_2}:${SAFE_2}`]: [queuedItemAt(3000)],
    })

    const { result } = renderHook(() => usePerSafePendingTransactions(2))

    await waitFor(() => expect(result.current.transactions).toHaveLength(2))
    expect(result.current.transactions.map((tx) => tx.transaction.timestamp)).toEqual([1000, 2000])
  })

  it('attaches the Safe address and chain ID to each transaction', async () => {
    respondWithSafeQueues({
      [`${CHAIN_1}:${SAFE_1}`]: [queuedItemAt(1000)],
      [`${CHAIN_2}:${SAFE_2}`]: [queuedItemAt(2000)],
    })

    const { result } = renderHook(() => usePerSafePendingTransactions())

    await waitFor(() => expect(result.current.transactions).toHaveLength(2))
    expect(result.current.transactions.map(({ safeAddress, chainId }) => [safeAddress, chainId])).toEqual([
      [SAFE_1, CHAIN_1],
      [SAFE_2, CHAIN_2],
    ])
  })

  it('returns an error when a Safe queue fails to load', async () => {
    respondWithSafeQueues(null)

    const { result } = renderHook(() => usePerSafePendingTransactions())

    await waitFor(() => expect(result.current.error).toBe('Failed to load pending transactions'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.transactions).toEqual([])
  })

  it('does not request the Safe queues when skipped', async () => {
    const requests = respondWithSafeQueues({})

    const { result } = renderHook(() => usePerSafePendingTransactions(3, true))

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requests).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.transactions).toEqual([])
  })

  it('requests each trusted Safe queue with the limit in the cursor', async () => {
    const requests = respondWithSafeQueues({})

    renderHook(() => usePerSafePendingTransactions(5))

    await waitFor(() => expect(requests).toHaveLength(2))
    expect(requests.map((url) => [url.searchParams.get('trusted'), url.searchParams.get('cursor')])).toEqual([
      ['true', 'limit=5&offset=0'],
      ['true', 'limit=5&offset=0'],
    ])
  })
})
