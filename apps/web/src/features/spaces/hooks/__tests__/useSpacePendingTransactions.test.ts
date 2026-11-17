import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { multisigTransactionBuilder, queuedTransactionItem } from '@/tests/builders/queuedTransaction'
import { useSpacePendingTransactions } from '../useSpacePendingTransactions'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
}))
jest.mock('../useSpaceSafesWithQueue', () => ({
  useSpaceSafesWithQueue: jest.fn(),
}))

const mockUseHasFeature = jest.requireMock('@/hooks/useChains').useHasFeature as jest.Mock
const mockUseSpaceSafesWithQueue = jest.requireMock('../useSpaceSafesWithQueue').useSpaceSafesWithQueue as jest.Mock

const spaceId = faker.string.uuid()
const SAFE_1 = faker.finance.ethereumAddress()
const SAFE_2 = faker.finance.ethereumAddress()
const CHAIN_1 = faker.string.numeric({ length: 3, allowLeadingZeros: false })
const CHAIN_2 = faker.string.numeric({ length: 4, allowLeadingZeros: false })

const signedInAuth = {
  sessionExpiresAt: Date.now() + 60_000,
  landingSpaceHint: null,
  isStoreHydrated: true,
  cfSafeSynced: false,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
}

const queuedItemAt = (timestamp: number, conflictType?: Parameters<typeof queuedTransactionItem>[1]) =>
  queuedTransactionItem(multisigTransactionBuilder().with({ timestamp }).build(), conflictType)

const createPage = (results: SpaceQueuedItemPage['results']): SpaceQueuedItemPage => ({
  count: null,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  counts: {
    total: 0,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
})

const respondWithQueue = (page: SpaceQueuedItemPage | null) => {
  const requests: URL[] = []
  server.use(
    http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, ({ request }) => {
      requests.push(new URL(request.url))
      return page ? HttpResponse.json(page) : new HttpResponse(null, { status: 500 })
    }),
  )
  return requests
}

const respondWithSafeQueues = (results: QueuedItemPage['results'] = []) => {
  const requests: URL[] = []
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:address/transactions/queued`, ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json<QueuedItemPage>({ count: results.length, next: null, previous: null, results })
    }),
  )
  return requests
}

const renderInSpace = (limit?: number, sessionExpiresAt: number | null = signedInAuth.sessionExpiresAt) =>
  renderHook(() => useSpacePendingTransactions(limit), {
    routerProps: { query: { spaceId } },
    initialReduxState: { auth: { ...signedInAuth, sessionExpiresAt } },
  })

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)))

describe('useSpacePendingTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpaceSafesWithQueue.mockReturnValue({
      safesWithQueue: [{ chainId: CHAIN_1, address: SAFE_1 }],
      isLoading: false,
    })
  })

  it('requests as many transactions from the Space queue as it shows', async () => {
    const requests = respondWithQueue(createPage({}))

    renderInSpace(4)

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].searchParams.get('limit')).toBe('4')
  })

  it('requests at most 5 transactions from the Space queue', async () => {
    const requests = respondWithQueue(createPage({}))

    renderInSpace(10)

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].searchParams.get('limit')).toBe('5')
  })

  it('returns the oldest transactions across Safes and chains, up to the limit', async () => {
    respondWithQueue(
      createPage({
        [SAFE_1]: { [CHAIN_1]: [queuedItemAt(3000)], [CHAIN_2]: [queuedItemAt(1000)] },
        [SAFE_2]: { [CHAIN_1]: [queuedItemAt(2000), queuedItemAt(4000)] },
      }),
    )

    const { result } = renderInSpace(3)

    await waitFor(() => expect(result.current.transactions).toHaveLength(3))
    expect(result.current.transactions.map((tx) => [tx.transaction.timestamp, tx.safeAddress, tx.chainId])).toEqual([
      [1000, SAFE_1, CHAIN_2],
      [2000, SAFE_2, CHAIN_1],
      [3000, SAFE_1, CHAIN_1],
    ])
    expect(result.current.count).toBe(3)
    expect(result.current.isLoading).toBe(false)
  })

  it('orders the latest transaction of each conflict group by age, not by nonce', async () => {
    const latestOfLowerNonce = queuedItemAt(5000, 'HasNext')
    const higherNonce = queuedItemAt(1000)
    respondWithQueue(
      createPage({
        [SAFE_1]: {
          [CHAIN_1]: [{ type: 'CONFLICT_HEADER', nonce: 1 }, latestOfLowerNonce, queuedItemAt(500, 'End'), higherNonce],
        },
      }),
    )

    const { result } = renderInSpace(1)

    await waitFor(() => expect(result.current.transactions).toHaveLength(1))
    expect(result.current.transactions[0].transaction.id).toBe(higherNonce.transaction.id)
  })

  it('keeps only the latest transaction of a conflict group', async () => {
    const latest = queuedItemAt(2000, 'HasNext')
    respondWithQueue(
      createPage({
        [SAFE_1]: {
          [CHAIN_1]: [{ type: 'CONFLICT_HEADER', nonce: 1 }, latest, queuedItemAt(1000, 'End')],
        },
      }),
    )

    const { result } = renderInSpace()

    await waitFor(() => expect(result.current.transactions).toHaveLength(1))
    expect(result.current.transactions[0].transaction.id).toBe(latest.transaction.id)
  })

  it('returns an error when the Space queue fails to load', async () => {
    respondWithQueue(null)

    const { result } = renderInSpace()

    await waitFor(() => expect(result.current.error).toBe('Failed to load pending transactions'))
    expect(result.current.transactions).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('requests the Space queue again on refetch', async () => {
    const requests = respondWithQueue(createPage({}))

    const { result } = renderInSpace()

    await waitFor(() => expect(requests).toHaveLength(1))
    await act(async () => result.current.refetch())
    await waitFor(() => expect(requests).toHaveLength(2))
  })

  it('does not request the Space queue when signed out, even on refetch', async () => {
    const requests = respondWithQueue(createPage({}))

    const { result } = renderInSpace(4, null)

    await act(async () => result.current.refetch())
    await settle()
    expect(requests).toHaveLength(0)
    expect(result.current.transactions).toEqual([])
  })

  it('does not request the per-Safe queues when the Space queue is enabled', async () => {
    const spaceRequests = respondWithQueue(createPage({}))
    const safeRequests = respondWithSafeQueues()

    renderInSpace(4)

    await waitFor(() => expect(spaceRequests).toHaveLength(1))
    await settle()
    expect(safeRequests).toHaveLength(0)
  })

  it('returns the per-Safe queues when the Space queue is disabled', async () => {
    mockUseHasFeature.mockReturnValue(false)
    const spaceRequests = respondWithQueue(createPage({}))
    const pending = queuedItemAt(1000)
    respondWithSafeQueues([pending])

    const { result } = renderInSpace(4)

    await waitFor(() => expect(result.current.transactions).toHaveLength(1))
    expect(result.current.transactions[0]).toMatchObject({
      transaction: { id: pending.transaction.id },
      safeAddress: SAFE_1,
      chainId: CHAIN_1,
    })
    expect(spaceRequests).toHaveLength(0)
  })

  it('reports loading until the chains config tells whether the Space queue is enabled', () => {
    mockUseHasFeature.mockReturnValue(undefined)

    const { result } = renderInSpace()

    expect(result.current.isLoading).toBe(true)
  })
})
