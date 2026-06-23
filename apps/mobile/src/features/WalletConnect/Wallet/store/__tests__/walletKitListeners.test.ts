import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { waitFor } from '@testing-library/react-native'
import { http, HttpResponse, delay } from 'msw'
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { GATEWAY_URL } from '@/src/config/constants'
import { server } from '@/src/tests/server'
import { rootReducer, type AppStartListening } from '@/src/store'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { cgwApi, type ProposeTransactionDto } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { setActiveSafe, switchActiveChain, clearActiveSafe } from '@/src/store/activeSafeSlice'
import walletKitListeners from '../walletKitListeners'
import {
  walletKitSliceName,
  setOutstandingRequest,
  markReviewAbandoned,
  markOutstandingProposing,
  pushPending,
  rejectPending,
  type DeferredTxMethod,
  type PendingItem,
} from '../walletKitSlice'

const mockRespond = jest.fn().mockResolvedValue(undefined)
const mockRejectSession = jest.fn().mockResolvedValue(undefined)
const mockWalletKit = {
  respondSessionRequest: mockRespond,
  rejectSession: mockRejectSession,
}
jest.mock('../../walletKit', () => ({ getWalletKit: jest.fn(() => Promise.resolve(mockWalletKit)) }))

const SAFE = '0x1111111111111111111111111111111111111111'
const OTHER_SAFE = '0x2222222222222222222222222222222222222222'
const HASH = '0xhash'

// A fresh listener middleware per store so registrations stay isolated between tests.
const makeStore = () => {
  const listenerMiddleware = createListenerMiddleware()
  walletKitListeners(listenerMiddleware.startListening as AppStartListening)
  return configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(cgwClient.middleware, listenerMiddleware.middleware),
  })
}

type Store = ReturnType<typeof makeStore>

const outstanding = (method: DeferredTxMethod = 'eth_sendTransaction', chainId = '1', safeAddress = SAFE) =>
  setOutstandingRequest({ safeTxHash: HASH, topic: 'topic-out', id: 1, method, chainId, safeAddress })

const requestItem = (id: number, chainId: string, safeAddress: string): PendingItem => ({
  kind: 'request',
  id,
  topic: `topic-${id}`,
  chainId,
  method: 'eth_sendTransaction',
  params: [{ to: '0xabc' }],
  safeAddress,
})

const getWcState = (store: Store) => store.getState()[walletKitSliceName]

const proposeUrl = `${GATEWAY_URL}/v1/chains/1/transactions/${SAFE}/propose`
const dispatchPropose = (store: Store) =>
  store.dispatch(
    cgwApi.endpoints.transactionsProposeTransactionV1.initiate({
      chainId: '1',
      safeAddress: SAFE,
      proposeTransactionDto: { safeTxHash: HASH } as ProposeTransactionDto,
    }) as never,
  )

const rejectedResponse = expect.objectContaining({ error: expect.anything() })

// Flush pending microtasks + timers so a no-op effect has had its chance to run before we
// assert that nothing happened (jest.useFakeTimers() is global in this project).
const flush = () => jest.advanceTimersByTimeAsync(50)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('walletKitListeners — propose lifecycle', () => {
  it('marks proposing while /propose is in flight, then responds with the hash and clears', async () => {
    server.use(
      http.post(proposeUrl, async () => {
        await delay(50)
        return HttpResponse.json({})
      }),
    )
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction'))

    dispatchPropose(store)
    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]?.proposing).toBe(true))

    await waitFor(() =>
      expect(mockRespond).toHaveBeenCalledWith({ topic: 'topic-out', response: formatJsonRpcResult(1, HASH) }),
    )
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
  })

  it('answers wallet_sendCalls with the { id } envelope', async () => {
    server.use(http.post(proposeUrl, () => HttpResponse.json({})))
    const store = makeStore()
    store.dispatch(outstanding('wallet_sendCalls'))

    dispatchPropose(store)
    await waitFor(() =>
      expect(mockRespond).toHaveBeenCalledWith({ topic: 'topic-out', response: formatJsonRpcResult(1, { id: HASH }) }),
    )
  })

  it('keeps the entry and clears proposing when /propose fails (not cancelled)', async () => {
    server.use(http.post(proposeUrl, () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction'))

    dispatchPropose(store)
    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]?.proposing).toBe(false))
    // Retained for a retry or a later back-out; no success response sent.
    expect(getWcState(store).outstandingRequests[HASH]).toBeDefined()
    expect(mockRespond).not.toHaveBeenCalled()
  })

  it('rejects the dApp when /propose fails after the user backed out (cancelRequested)', async () => {
    server.use(
      http.post(proposeUrl, async () => {
        await delay(50)
        return HttpResponse.json({ error: 'boom' }, { status: 500 })
      }),
    )
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction'))

    dispatchPropose(store)
    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]?.proposing).toBe(true))
    // User backs out while /propose is in flight: the abandon listener no-ops (proposing),
    // but the reducer records cancelRequested for the propose-rejected listener to honour.
    store.dispatch(markReviewAbandoned({ safeTxHash: HASH }))
    expect(mockRespond).not.toHaveBeenCalled()

    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith({ topic: 'topic-out', response: rejectedResponse }))
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
  })
})

describe('walletKitListeners — markReviewAbandoned', () => {
  it('rejects a handed-off tx that is not proposing and clears it', async () => {
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction'))

    store.dispatch(markReviewAbandoned({ safeTxHash: HASH }))
    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith({ topic: 'topic-out', response: rejectedResponse }))
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
  })

  it('does not reject while /propose is in flight (proposing)', async () => {
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction'))
    store.dispatch(markOutstandingProposing({ safeTxHash: HASH, proposing: true }))

    store.dispatch(markReviewAbandoned({ safeTxHash: HASH }))
    await flush()
    expect(mockRespond).not.toHaveBeenCalled()
    expect(getWcState(store).outstandingRequests[HASH]).toBeDefined()
  })

  it('is a no-op for a non-WC tx (no outstanding request)', async () => {
    const store = makeStore()
    store.dispatch(markReviewAbandoned({ safeTxHash: HASH }))
    await flush()
    expect(mockRespond).not.toHaveBeenCalled()
  })
})

describe('walletKitListeners — rejectPending', () => {
  it('responds USER_REJECTED and removes a pending request', async () => {
    const store = makeStore()
    const item = requestItem(2, 'eip155:1', SAFE)
    store.dispatch(pushPending(item))

    store.dispatch(rejectPending(item))
    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith({ topic: 'topic-2', response: rejectedResponse }))
    expect(getWcState(store).pending).toHaveLength(0)
  })

  it('rejects the session and removes a pending proposal', async () => {
    const store = makeStore()
    const item: PendingItem = { kind: 'proposal', id: 9, proposal: { id: 9 } as never }
    store.dispatch(pushPending(item))

    store.dispatch(rejectPending(item))
    await waitFor(() => expect(mockRejectSession).toHaveBeenCalledWith(expect.objectContaining({ id: 9 })))
    expect(mockRespond).not.toHaveBeenCalled()
    expect(getWcState(store).pending).toHaveLength(0)
  })
})

describe('walletKitListeners — safe/chain switch', () => {
  it('rejects outstanding + pending requests that do not match the newly set active Safe', async () => {
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction', '1', SAFE)) // stale: different address
    store.dispatch(pushPending(requestItem(2, 'eip155:1', OTHER_SAFE))) // matches new Safe
    store.dispatch(pushPending(requestItem(3, 'eip155:137', OTHER_SAFE))) // stale: different chain

    store.dispatch(setActiveSafe({ address: OTHER_SAFE as `0x${string}`, chainId: '1' }))

    await waitFor(() => expect(mockRespond).toHaveBeenCalledTimes(2))
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
    expect(getWcState(store).pending).toHaveLength(1)
    expect(getWcState(store).pending[0]).toMatchObject({ id: 2 })
  })

  it('keeps same-chain entries on switchActiveChain and rejects cross-chain ones', async () => {
    const store = makeStore()
    store.dispatch(outstanding('eth_sendTransaction', '137', SAFE)) // stale after switching to 1
    store.dispatch(pushPending(requestItem(4, 'eip155:1', SAFE))) // same chain → kept

    store.dispatch(switchActiveChain({ chainId: '1' }))

    await waitFor(() => expect(mockRespond).toHaveBeenCalledTimes(1))
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
    expect(getWcState(store).pending).toHaveLength(1)
  })

  it('rejects everything on clearActiveSafe', async () => {
    const store = makeStore()
    store.dispatch(outstanding())
    store.dispatch(pushPending(requestItem(5, 'eip155:1', SAFE)))

    store.dispatch(clearActiveSafe())

    await waitFor(() => expect(mockRespond).toHaveBeenCalledTimes(2))
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
    expect(getWcState(store).pending).toHaveLength(0)
  })
})
