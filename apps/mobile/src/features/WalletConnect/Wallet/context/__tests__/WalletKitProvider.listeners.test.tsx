import React from 'react'
import { Text } from 'react-native'
import { waitFor } from '@testing-library/react-native'
import { configureStore } from '@reduxjs/toolkit'
import { http, HttpResponse, delay } from 'msw'
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { GATEWAY_URL } from '@/src/config/constants'
import { server } from '@/src/tests/server'
import { renderWithStore } from '@/src/tests/test-utils'
import { rootReducer, listenerMiddlewareInstance } from '@/src/store'
import type { TestStore } from '@/src/tests/test-utils'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { cgwApi, type ProposeTransactionDto } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { setActiveSafe, switchActiveChain, clearActiveSafe } from '@/src/store/activeSafeSlice'
import { WalletKitProvider } from '../WalletKitProvider'
import {
  walletKitSliceName,
  setOutstandingRequest,
  pushPending,
  type DeferredTxMethod,
} from '../../store/walletKitSlice'
import type { IWalletKit } from '@reown/walletkit'

// Same isolation mocks as WalletKitProvider.test.
jest.mock('expo-linking', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn().mockResolvedValue(null),
}))
jest.mock('../../components/RequestSheetHost', () => ({ RequestSheetHost: () => null }))
jest.mock('../../hooks/useActiveSafeBinding', () => ({ useActiveSafeBinding: jest.fn() }))

const mockRespond = jest.fn().mockResolvedValue(undefined)
const mockWalletKit = {
  getActiveSessions: jest.fn(() => ({})),
  getPendingSessionRequests: jest.fn(() => []),
  on: jest.fn(),
  off: jest.fn(),
  pair: jest.fn().mockResolvedValue(undefined),
  rejectSessionAuthenticate: jest.fn().mockResolvedValue(undefined),
  respondSessionRequest: mockRespond,
} as unknown as IWalletKit

jest.mock('../../walletKit', () => ({ getWalletKit: jest.fn(() => Promise.resolve(mockWalletKit)) }))

const SAFE = '0x1111111111111111111111111111111111111111'
const OTHER_SAFE = '0x2222222222222222222222222222222222222222'
const HASH = '0xhash'

// The provider registers its listeners via the app-singleton listener middleware, so the
// test store must include that instance's middleware for the effects to run.
const makeListenerStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (gdm) =>
      gdm({ serializableCheck: false }).concat(cgwClient.middleware, listenerMiddlewareInstance.middleware),
  }) as unknown as TestStore

const outstanding = (method: DeferredTxMethod = 'eth_sendTransaction', chainId = '1', safeAddress = SAFE) =>
  setOutstandingRequest({ safeTxHash: HASH, topic: 'topic-out', id: 1, method, chainId, safeAddress })

const pendingRequest = (id: number, chainId: string, safeAddress: string) =>
  pushPending({
    kind: 'request',
    id,
    topic: `topic-${id}`,
    chainId,
    method: 'eth_sendTransaction',
    params: [{ to: '0xabc' }],
    safeAddress,
  })

const renderProvider = (store: TestStore) =>
  renderWithStore(
    <WalletKitProvider>
      <Text>child</Text>
    </WalletKitProvider>,
    store,
  )

const waitForListeners = async () => {
  await waitFor(() => expect(mockWalletKit.on).toHaveBeenCalled())
}

const dispatchPropose = (store: TestStore) =>
  store.dispatch(
    cgwApi.endpoints.transactionsProposeTransactionV1.initiate({
      chainId: '1',
      safeAddress: SAFE,
      proposeTransactionDto: { safeTxHash: HASH } as ProposeTransactionDto,
    }) as never,
  )

const proposeUrl = `${GATEWAY_URL}/v1/chains/1/transactions/${SAFE}/propose`

const getWcState = (store: TestStore) => store.getState()[walletKitSliceName]

describe('WalletKitProvider listeners', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('marks the outstanding request proposing while /propose is in flight, then responds and clears it', async () => {
    server.use(
      http.post(proposeUrl, async () => {
        await delay(50)
        return HttpResponse.json({})
      }),
    )
    const store = makeListenerStore()
    renderProvider(store)
    await waitForListeners()
    store.dispatch(outstanding('eth_sendTransaction'))

    dispatchPropose(store)
    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]?.proposing).toBe(true))

    await waitFor(() =>
      expect(mockRespond).toHaveBeenCalledWith({
        topic: 'topic-out',
        response: formatJsonRpcResult(1, HASH),
      }),
    )
    expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined()
  })

  it('answers wallet_sendCalls with the { id } envelope', async () => {
    server.use(http.post(proposeUrl, () => HttpResponse.json({})))
    const store = makeListenerStore()
    renderProvider(store)
    await waitForListeners()
    store.dispatch(outstanding('wallet_sendCalls'))

    dispatchPropose(store)
    await waitFor(() =>
      expect(mockRespond).toHaveBeenCalledWith({
        topic: 'topic-out',
        response: formatJsonRpcResult(1, { id: HASH }),
      }),
    )
  })

  it('keeps the entry and clears the proposing flag when /propose fails', async () => {
    server.use(http.post(proposeUrl, () => HttpResponse.json({ error: 'boom' }, { status: 500 })))
    const store = makeListenerStore()
    renderProvider(store)
    await waitForListeners()
    store.dispatch(outstanding('eth_sendTransaction'))

    dispatchPropose(store)
    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]?.proposing).toBe(false))
    // Retained for a retry or a reject-on-back; no success response sent.
    expect(getWcState(store).outstandingRequests[HASH]).toBeDefined()
    expect(mockRespond).not.toHaveBeenCalled()
  })

  it('rejects outstanding + pending requests that do not match the newly set active Safe', async () => {
    const store = makeListenerStore()
    renderProvider(store)
    await waitForListeners()
    store.dispatch(outstanding('eth_sendTransaction', '1', SAFE)) // stale: different address below
    store.dispatch(pendingRequest(2, 'eip155:1', OTHER_SAFE)) // matches the new Safe
    store.dispatch(pendingRequest(3, 'eip155:137', OTHER_SAFE)) // stale: different chain

    store.dispatch(setActiveSafe({ address: OTHER_SAFE as `0x${string}`, chainId: '1' }))

    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined())
    await waitFor(() => expect(getWcState(store).pending).toHaveLength(1))
    expect(getWcState(store).pending[0]).toMatchObject({ id: 2 })
    expect(mockRespond).toHaveBeenCalledTimes(2)
    expect(mockRespond).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'topic-out', response: expect.objectContaining({ error: expect.anything() }) }),
    )
    expect(mockRespond).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'topic-3', response: expect.objectContaining({ error: expect.anything() }) }),
    )
  })

  it('keeps same-chain entries on switchActiveChain and rejects cross-chain ones', async () => {
    const store = makeListenerStore()
    renderProvider(store)
    await waitForListeners()
    store.dispatch(outstanding('eth_sendTransaction', '137', SAFE)) // stale after switching to 1
    store.dispatch(pendingRequest(4, 'eip155:1', SAFE)) // same chain → kept (address irrelevant)

    store.dispatch(switchActiveChain({ chainId: '1' }))

    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined())
    expect(getWcState(store).pending).toHaveLength(1)
    expect(mockRespond).toHaveBeenCalledTimes(1)
  })

  it('rejects everything on clearActiveSafe', async () => {
    const store = makeListenerStore()
    renderProvider(store)
    await waitForListeners()
    store.dispatch(outstanding())
    store.dispatch(pendingRequest(5, 'eip155:1', SAFE))

    store.dispatch(clearActiveSafe())

    await waitFor(() => expect(getWcState(store).outstandingRequests[HASH]).toBeUndefined())
    await waitFor(() => expect(getWcState(store).pending).toHaveLength(0))
    expect(mockRespond).toHaveBeenCalledTimes(2)
  })
})
