import { faker } from '@faker-js/faker'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { Provider } from 'react-redux'
import { http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionListItemType, TransactionStatus } from '@safe-global/store/gateway/types'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { POLLING_INTERVAL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { AppRoutes } from '@/config/routes'
import { makeStore } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { PendingStatus, setPendingTx } from '@/store/pendingTxsSlice'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { server } from '@/tests/server'
import { useSpaceQueuePolling } from '../useSpaceQueuePolling'

const mockSpaceId = jest.fn<string | null, []>()
const mockIsActiveMember = jest.fn<boolean, []>()
const mockHasFeature = jest.fn<boolean | undefined, []>()
const mockWalletAddress = jest.fn<string | undefined, []>()
const mockIsAuthenticated = jest.fn<boolean, []>()

jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockSpaceId() }))
jest.mock('../useSpaceMembers', () => ({ useIsActiveMember: () => mockIsActiveMember() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockHasFeature() }))
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => {
    const address = mockWalletAddress()
    return address ? { address } : null
  },
}))
jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: () => mockIsAuthenticated(),
}))

const chainId = '1'
const safeAddress = faker.finance.ethereumAddress()
const wallet = faker.finance.ethereumAddress()

const queuedTx = (missingSigners: string[], txStatus = TransactionStatus.AWAITING_CONFIRMATIONS) => {
  const item: TransactionQueuedItem = {
    type: TransactionListItemType.TRANSACTION,
    conflictType: 'None',
    transaction: safeTxSummaryBuilder()
      .with({
        id: `multisig_${safeAddress}_${faker.string.hexadecimal({ length: 64 })}`,
        txStatus,
        executionInfo: executionInfoBuilder()
          .with({ missingSigners: missingSigners.map((value) => ({ value })) })
          .build(),
      })
      .build(),
  }
  return item
}

const page = (items: TransactionQueuedItem[]): SpaceQueuedItemPage => ({
  count: items.length,
  next: null,
  previous: null,
  results: items.length > 0 ? { [safeAddress]: { [chainId]: items } } : {},
  unavailableSafes: [],
  counts: {
    total: items.length,
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

const renderPolling = (store = makeStore()) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  const utils = renderHook(() => useSpaceQueuePolling(), { wrapper })
  return { store, ...utils }
}

const messages = (store: ReturnType<typeof makeStore>) => selectNotifications(store.getState()).map((n) => n.message)

describe('useSpaceQueuePolling', () => {
  let spaceId: string
  let queue: TransactionQueuedItem[]
  let requests: URL[]

  beforeEach(() => {
    spaceId = faker.string.uuid()
    queue = []
    requests = []
    setBaseUrl(GATEWAY_URL)
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/transactions/queued`, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(page(queue))
      }),
    )
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    mockSpaceId.mockReturnValue(spaceId)
    mockIsActiveMember.mockReturnValue(true)
    mockHasFeature.mockReturnValue(true)
    mockWalletAddress.mockReturnValue(wallet)
    mockIsAuthenticated.mockReturnValue(true)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('requests the queue of the Space without filters', async () => {
    renderPolling()

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0].pathname).toBe(`/v1/spaces/${spaceId}/transactions/queued`)
    expect(requests[0].search).toBe('')
  })

  it('requests the queue again at every poll', async () => {
    renderPolling()
    await waitFor(() => expect(requests).toHaveLength(1))

    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    expect(requests).toHaveLength(2)
  })

  it.each([
    ['there is no Space', () => mockSpaceId.mockReturnValue(null)],
    ['the flag is off', () => mockHasFeature.mockReturnValue(false)],
    ['the user is not an active member', () => mockIsActiveMember.mockReturnValue(false)],
    ['the user is signed out', () => mockIsAuthenticated.mockReturnValue(false)],
  ])('does not request the queue when %s', async (_, arrange) => {
    arrange()

    renderPolling()
    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    expect(requests).toHaveLength(0)
  })

  it.each([
    [TxEvent.PROPOSED, () => txDispatch(TxEvent.PROPOSED, { txId: 'tx', nonce: 1, chainId, safeAddress })],
    [
      TxEvent.SIGNATURE_PROPOSED,
      () =>
        txDispatch(TxEvent.SIGNATURE_PROPOSED, { txId: 'tx', nonce: 1, chainId, safeAddress, signerAddress: wallet }),
    ],
    [TxEvent.PROCESSED, () => txDispatch(TxEvent.PROCESSED, { txId: 'tx', nonce: 1, chainId, safeAddress })],
    [TxEvent.SUCCESS, () => txDispatch(TxEvent.SUCCESS, { txId: 'tx', nonce: 1, chainId, safeAddress })],
    [TxEvent.DELETED, () => txDispatch(TxEvent.DELETED, { safeTxHash: '0x' })],
  ])('requests the queue again on %s', async (_, dispatchEvent) => {
    renderPolling()
    await waitFor(() => expect(requests).toHaveLength(1))

    act(() => dispatchEvent())

    await waitFor(() => expect(requests).toHaveLength(2))
  })

  it('does not request the queue on a transaction event while inactive', async () => {
    mockHasFeature.mockReturnValue(false)
    renderPolling()

    act(() => txDispatch(TxEvent.PROPOSED, { txId: 'tx', nonce: 1, chainId, safeAddress }))
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(requests).toHaveLength(0)
  })

  it('toasts once for a new transaction the wallet can sign', async () => {
    queue = [queuedTx([wallet])]
    const { store } = renderPolling()
    await waitFor(() => expect(messages(store)).toHaveLength(1))

    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    expect(messages(store)).toEqual(['A transaction requires your confirmation.'])
  })

  it('links the toast to the queue of the Space', async () => {
    queue = [queuedTx([wallet])]
    const { store } = renderPolling()

    await waitFor(() => expect(messages(store)).toHaveLength(1))
    expect(selectNotifications(store.getState())[0].link).toEqual({
      href: { pathname: AppRoutes.spaces.transactions, query: { spaceId } },
      title: 'View transactions',
    })
  })

  it('does not toast again for the same transaction after a remount', async () => {
    queue = [queuedTx([wallet])]
    const store = makeStore()
    const { unmount } = renderPolling(store)
    await waitFor(() => expect(messages(store)).toHaveLength(1))
    unmount()

    renderPolling(store)
    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    expect(messages(store)).toHaveLength(1)
  })

  it('aggregates several new signable transactions into one toast', async () => {
    queue = [queuedTx([wallet]), queuedTx([wallet])]

    const { store } = renderPolling()

    await waitFor(() => expect(messages(store)).toEqual(['2 transactions require your confirmation.']))
  })

  it('does not toast for a transaction the wallet cannot sign', async () => {
    queue = [queuedTx([faker.finance.ethereumAddress()])]

    const { store } = renderPolling()
    await waitFor(() => expect(requests).toHaveLength(1))
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(messages(store)).toEqual([])
  })

  it('does not toast for a transaction awaiting execution', async () => {
    queue = [queuedTx([wallet], TransactionStatus.AWAITING_EXECUTION)]

    const { store } = renderPolling()
    await waitFor(() => expect(requests).toHaveLength(1))
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(messages(store)).toEqual([])
  })

  it('does not toast for a pending transaction', async () => {
    const tx = queuedTx([wallet])
    queue = [tx]
    const store = makeStore()
    store.dispatch(
      setPendingTx({
        txId: tx.transaction.id,
        chainId,
        safeAddress,
        nonce: 1,
        status: PendingStatus.SIGNING,
        signerAddress: wallet,
      }),
    )

    renderPolling(store)
    await waitFor(() => expect(requests).toHaveLength(1))
    await act(() => jest.advanceTimersByTimeAsync(0))

    expect(messages(store)).toEqual([])
  })
})
