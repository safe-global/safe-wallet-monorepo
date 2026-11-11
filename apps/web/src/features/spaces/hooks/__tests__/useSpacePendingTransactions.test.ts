import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { useHasFeature } from '@/hooks/useChains'
import { useSpacePendingTransactions } from '../useSpacePendingTransactions'
import { usePerSafePendingTransactions } from '../usePerSafePendingTransactions'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
}))
jest.mock('../usePerSafePendingTransactions', () => ({
  usePerSafePendingTransactions: jest.fn(),
}))

const mockUseHasFeature = useHasFeature as jest.Mock
const mockUsePerSafePendingTransactions = usePerSafePendingTransactions as jest.Mock

const spaceId = faker.string.uuid()
const SAFE_1 = faker.finance.ethereumAddress()
const SAFE_2 = faker.finance.ethereumAddress()

const signedInAuth = {
  sessionExpiresAt: Date.now() + 60_000,
  landingSpaceHint: null,
  isStoreHydrated: true,
  cfSafeSynced: false,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
}

const createQueuedItem = (
  timestamp: number,
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  transaction: {
    id: faker.string.uuid(),
    txHash: null,
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
  },
  conflictType,
})

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

const renderInSpace = (limit?: number, sessionExpiresAt: number | null = signedInAuth.sessionExpiresAt) =>
  renderHook(() => useSpacePendingTransactions(limit), {
    routerProps: { query: { spaceId } },
    initialReduxState: { auth: { ...signedInAuth, sessionExpiresAt } },
  })

const perSafeResult = {
  transactions: [],
  count: 0,
  isLoading: false,
  error: undefined,
  refetch: jest.fn(),
}

describe('useSpacePendingTransactions', () => {
  beforeEach(() => {
    mockUseHasFeature.mockReturnValue(true)
    mockUsePerSafePendingTransactions.mockReturnValue(perSafeResult)
  })

  it('requests the Space queue with the limit as a query parameter', async () => {
    const requests = respondWithQueue(createPage({}))

    renderInSpace(4)

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].searchParams.get('limit')).toBe('4')
  })

  it('returns the oldest transactions across Safes and chains, up to the limit', async () => {
    respondWithQueue(
      createPage({
        [SAFE_1]: { '1': [createQueuedItem(3000)], '137': [createQueuedItem(1000)] },
        [SAFE_2]: { '1': [createQueuedItem(2000), createQueuedItem(4000)] },
      }),
    )

    const { result } = renderInSpace(3)

    await waitFor(() => expect(result.current.transactions).toHaveLength(3))
    expect(result.current.transactions.map((tx) => [tx.transaction.timestamp, tx.safeAddress, tx.chainId])).toEqual([
      [1000, SAFE_1, '137'],
      [2000, SAFE_2, '1'],
      [3000, SAFE_1, '1'],
    ])
    expect(result.current.count).toBe(3)
    expect(result.current.isLoading).toBe(false)
  })

  it('keeps only the latest transaction of a conflict group', async () => {
    const latest = createQueuedItem(2000, 'HasNext')
    respondWithQueue(
      createPage({
        [SAFE_1]: {
          '1': [{ type: 'CONFLICT_HEADER', nonce: 1 }, latest, createQueuedItem(1000, 'End')],
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
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(requests).toHaveLength(0)
    expect(result.current.transactions).toEqual([])
  })

  it('skips the per-Safe queues when the Space queue is enabled', async () => {
    respondWithQueue(createPage({}))

    renderInSpace(4)

    expect(mockUsePerSafePendingTransactions).toHaveBeenCalledWith(4, true)
  })

  it('falls back to the per-Safe queues when the Space queue is disabled', async () => {
    mockUseHasFeature.mockReturnValue(false)
    const requests = respondWithQueue(createPage({}))

    const { result } = renderInSpace(4)

    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
    expect(requests).toHaveLength(0)
    expect(mockUsePerSafePendingTransactions).toHaveBeenCalledWith(4, false)
    expect(result.current).toBe(perSafeResult)
  })

  it('reports loading until the chains config tells whether the Space queue is enabled', () => {
    mockUseHasFeature.mockReturnValue(undefined)

    const { result } = renderInSpace()

    expect(result.current.isLoading).toBe(true)
    expect(mockUsePerSafePendingTransactions).toHaveBeenCalledWith(3, true)
  })
})
