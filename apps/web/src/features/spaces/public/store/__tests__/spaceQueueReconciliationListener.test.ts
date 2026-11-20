import { faker } from '@faker-js/faker'
import { combineReducers, configureStore, createListenerMiddleware, type Middleware } from '@reduxjs/toolkit'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { waitFor } from '@/tests/test-utils'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import {
  cgwApi as spacesApi,
  type SpaceQueuedItemPage,
  type SpaceTransactionsGetTransactionQueueV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionListItemType, TransactionStatus } from '@safe-global/store/gateway/types'
import type { RootState } from '@/store'
import {
  clearPendingTx,
  PendingStatus,
  pendingTxsSlice,
  PendingTxType,
  setPendingTx,
  type PendingProcessingTx,
} from '@/store/pendingTxsSlice'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { spaceQueueReconciliationListener } from '../spaceQueueReconciliationListener'

jest.mock('@/services/tx/txEvents', () => ({
  ...jest.requireActual('@/services/tx/txEvents'),
  txDispatch: jest.fn(),
}))

const mockTxDispatch = txDispatch as jest.MockedFunction<typeof txDispatch>

const spaceId = faker.string.uuid()
const chainId = '1'
const safeAddress = faker.finance.ethereumAddress()

const makeTestStore = () => {
  setBaseUrl(GATEWAY_URL)
  const listenerMiddleware = createListenerMiddleware<RootState>()
  spaceQueueReconciliationListener(listenerMiddleware)
  return configureStore({
    reducer: combineReducers({
      [pendingTxsSlice.name]: pendingTxsSlice.reducer,
      [cgwClient.reducerPath]: cgwClient.reducer,
    }),
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false })
        .prepend(listenerMiddleware.middleware as Middleware)
        .concat(cgwClient.middleware),
  })
}

type TestStore = ReturnType<typeof makeTestStore>

const queuedTx = (txId: string, nonce: number, missingSigners: string[] = []): TransactionQueuedItem => ({
  type: TransactionListItemType.TRANSACTION,
  conflictType: 'None',
  transaction: safeTxSummaryBuilder()
    .with({
      id: txId,
      txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
      executionInfo: executionInfoBuilder()
        .with({ nonce, missingSigners: missingSigners.map((value) => ({ value })) })
        .build(),
    })
    .build(),
})

type QueueResults = SpaceQueuedItemPage['results']

const results = (items: TransactionQueuedItem[], chain = chainId, safe = safeAddress): QueueResults => ({
  [safe]: { [chain]: items },
})

const page = (resultList: QueueResults[], overrides: Partial<SpaceQueuedItemPage> = {}): SpaceQueuedItemPage => ({
  count: null,
  next: null,
  previous: null,
  results: resultList.reduce<QueueResults>((all, safes) => {
    for (const [safe, chains] of Object.entries(safes)) all[safe] = { ...all[safe], ...chains }
    return all
  }, {}),
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
  ...overrides,
})

const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`

const respondWithQueue = (queue: SpaceQueuedItemPage) => server.use(http.get(queueUrl, () => HttpResponse.json(queue)))

const respondWithDetails = (
  txId: string,
  details: { txStatus: TransactionStatus; txHash?: string },
  onRequest?: () => void,
) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/${chainId}/transactions/${txId}`, () => {
      onRequest?.()
      return HttpResponse.json(
        transactionDetailsBuilder()
          .with({ txId, ...details })
          .build(),
      )
    }),
  )

const respondWithSpaceSafes = (safes: Record<string, string[]>) =>
  server.use(http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => HttpResponse.json({ safes })))

const pollQueue = async (
  store: TestStore,
  params: Omit<SpaceTransactionsGetTransactionQueueV1ApiArg, 'spaceId'> = {},
) => {
  await store.dispatch(spacesApi.endpoints.spaceTransactionsGetTransactionQueueV1.initiate({ spaceId, ...params }))
}

const hasRequestedTxDetails = (store: TestStore) =>
  Object.values(store.getState()[cgwClient.reducerPath].queries).some(
    (query) => query?.endpointName === 'transactionsGetTransactionByIdV1',
  )

const processingTx = (nonce: number, safe = safeAddress): PendingProcessingTx => ({
  chainId,
  safeAddress: safe,
  nonce,
  groupKey: faker.string.alphanumeric(8),
  status: PendingStatus.PROCESSING,
  txHash: faker.string.hexadecimal({ length: 64 }),
  submittedAt: Date.now(),
  signerNonce: 1,
  signerAddress: faker.finance.ethereumAddress(),
  txType: PendingTxType.SAFE_TX,
})

const txId = () => `multisig_${safeAddress}_${faker.string.hexadecimal({ length: 64 })}`

describe('spaceQueueReconciliationListener', () => {
  beforeEach(() => {
    mockTxDispatch.mockReset()
  })

  it('should dispatch SIGNATURE_INDEXED once the signer left the missing signers', async () => {
    const store = makeTestStore()
    const id = txId()
    const signerAddress = faker.finance.ethereumAddress()
    store.dispatch(
      setPendingTx({ txId: id, chainId, safeAddress, nonce: 3, status: PendingStatus.SIGNING, signerAddress }),
    )
    respondWithQueue(page([results([queuedTx(id, 3, [faker.finance.ethereumAddress()])])]))

    await pollQueue(store)

    expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.SIGNATURE_INDEXED, { txId: id })
  })

  it('should not dispatch SIGNATURE_INDEXED while the signer is still missing', async () => {
    const store = makeTestStore()
    const id = txId()
    const signerAddress = faker.finance.ethereumAddress()
    store.dispatch(
      setPendingTx({ txId: id, chainId, safeAddress, nonce: 3, status: PendingStatus.SIGNING, signerAddress }),
    )
    respondWithQueue(page([results([queuedTx(id, 3, [signerAddress])])]))

    await pollQueue(store)

    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch SUCCESS for an executed tx that left the queue', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    const txHash = faker.string.hexadecimal({ length: 64 })
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS, txHash })

    await pollQueue(store)

    await waitFor(() =>
      expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.SUCCESS, {
        txId: id,
        chainId,
        safeAddress,
        nonce: 4,
        groupKey: pendingTx.groupKey,
        txHash,
      }),
    )
  })

  it('should dispatch SUCCESS when a listed Safe has no queued txs and no later page', async () => {
    const store = makeTestStore()
    const id = txId()
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    respondWithQueue(page([]))
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS })

    await pollQueue(store)

    await waitFor(() =>
      expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.SUCCESS, expect.objectContaining({ txId: id })),
    )
  })

  it.each([
    [TransactionStatus.CANCELLED, 'Another transaction with the same nonce was executed instead.'],
    [TransactionStatus.FAILED, 'The transaction failed on-chain.'],
  ])('should report a failed execution when its details are %s', async (txStatus, reason) => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))
    respondWithDetails(id, { txStatus })

    await pollQueue(store)

    await waitFor(() =>
      expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.FAILED, {
        txId: id,
        chainId,
        safeAddress,
        nonce: 4,
        groupKey: pendingTx.groupKey,
        error: new Error(reason),
      }),
    )
  })

  it('should do nothing when the entry is gone before the details arrive', async () => {
    const store = makeTestStore()
    const id = txId()
    let requested = false
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS }, () => {
      requested = true
      store.dispatch(clearPendingTx({ txId: id }))
    })

    await pollQueue(store)

    await waitFor(() => expect(requested).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should leave a pending tx of a Safe that is not in the response untouched', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4, faker.finance.ethereumAddress())
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should leave a pending tx of an unavailable Safe untouched', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])], { unavailableSafes: [{ chainId, safeAddress }] }))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
  })

  it('should leave a pending tx of a listed Safe missing from the queue untouched when the gateway capped the queue', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    const otherSafe = faker.finance.ethereumAddress()
    const shown = [queuedTx(txId(), 0), queuedTx(txId(), 1)]
    respondWithQueue(page([results(shown, chainId, otherSafe)], { count: shown.length + 1 }))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should settle a pending tx of a listed Safe from its own queue when another Safe comes first', async () => {
    const store = makeTestStore()
    const id = txId()
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    respondWithQueue(
      page([results([queuedTx(txId(), 1)], chainId, faker.finance.ethereumAddress()), results([queuedTx(txId(), 5)])]),
    )
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS })

    await pollQueue(store)

    await waitFor(() =>
      expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.SUCCESS, expect.objectContaining({ txId: id })),
    )
  })

  it('should leave a pending tx untouched when its Safe still queues its nonce after another Safe', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    respondWithQueue(
      page([results([queuedTx(txId(), 1)], chainId, faker.finance.ethereumAddress()), results([queuedTx(txId(), 4)])]),
    )

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch SUCCESS when a listed Safe queues only on another chain', async () => {
    const store = makeTestStore()
    const id = txId()
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    respondWithQueue(page([results([queuedTx(txId(), 2)], faker.string.numeric(5))]))
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS })

    await pollQueue(store)

    await waitFor(() =>
      expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.SUCCESS, expect.objectContaining({ txId: id })),
    )
  })

  it.each<[string, Omit<SpaceTransactionsGetTransactionQueueV1ApiArg, 'spaceId'>]>([
    ['a status', { status: ['sign'] }],
    ['the conflicting flag', { conflicting: true }],
    ['the stale flag', { stale: true }],
    ['a Safe', { safes: `${chainId}:${safeAddress}` }],
    ['a network', { chainIds: chainId }],
    ['a signer', { signers: faker.finance.ethereumAddress() }],
    ['a search', { search: faker.lorem.word() }],
  ])('should leave a pending tx untouched when a queue narrowed by %s leaves it out', async (_, params) => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    respondWithQueue(page([results([queuedTx(txId(), 2)], faker.string.numeric(5))]))
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS })

    await pollQueue(store, params)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
    expect(hasRequestedTxDetails(store)).toBe(false)
  })

  it('should leave a pending tx untouched while its nonce is still queued', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([results([queuedTx(txId(), 4)])]))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
  })

  it('should leave the child Safe pending while the parent approval is not executed', async () => {
    const store = makeTestStore()
    const id = txId()
    const parentAddress = faker.finance.ethereumAddress()
    store.dispatch(
      setPendingTx({
        txId: id,
        chainId,
        safeAddress,
        nonce: 3,
        status: PendingStatus.NESTED_SIGNING,
        signerAddress: parentAddress,
        txHashOrParentSafeTxHash: faker.string.hexadecimal({ length: 64 }),
        executed: false,
        method: 'approveHash',
      }),
    )
    respondWithQueue(page([results([queuedTx(id, 3, [parentAddress])])]))

    await pollQueue(store)

    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch SIGNATURE_INDEXED for the child Safe once the parent approval is executed', async () => {
    const store = makeTestStore()
    const id = txId()
    const parentAddress = faker.finance.ethereumAddress()
    store.dispatch(
      setPendingTx({
        txId: id,
        chainId,
        safeAddress,
        nonce: 3,
        status: PendingStatus.NESTED_SIGNING,
        signerAddress: parentAddress,
        txHashOrParentSafeTxHash: faker.string.hexadecimal({ length: 64 }),
        executed: true,
        method: 'approveHash',
      }),
    )
    respondWithQueue(page([results([queuedTx(id, 3, [faker.finance.ethereumAddress()])])]))

    await pollQueue(store)

    expect(mockTxDispatch).toHaveBeenCalledTimes(1)
    expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.SIGNATURE_INDEXED, { txId: id })
  })

  it('should dispatch SUCCESS once for a tx across two polls', async () => {
    const store = makeTestStore()
    const id = txId()
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    mockTxDispatch.mockImplementation((event: TxEvent, payload: unknown) => {
      if (event === TxEvent.SUCCESS) store.dispatch(clearPendingTx({ txId: (payload as { txId: string }).txId }))
    })
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))
    respondWithDetails(id, { txStatus: TransactionStatus.SUCCESS })

    await pollQueue(store)
    await waitFor(() => expect(store.getState().pendingTxs[id]).toBeUndefined())
    await pollQueue(store)

    expect(mockTxDispatch.mock.calls.filter(([event]) => event === TxEvent.SUCCESS)).toHaveLength(1)
  })

  it('should not report SUCCESS for a deleted tx whose details are not found', async () => {
    const store = makeTestStore()
    const id = txId()
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${chainId}/transactions/${id}`, () => new HttpResponse(null, { status: 404 })),
    )

    await pollQueue(store)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should report the other option of a conflict as cancelled once one option executes', async () => {
    const store = makeTestStore()
    const executedId = txId()
    const cancelledId = txId()
    const cancelled = processingTx(4)
    store.dispatch(setPendingTx({ txId: executedId, ...processingTx(4) }))
    store.dispatch(setPendingTx({ txId: cancelledId, ...cancelled }))
    respondWithQueue(page([results([queuedTx(txId(), 5)])]))
    respondWithDetails(executedId, { txStatus: TransactionStatus.SUCCESS })
    respondWithDetails(cancelledId, { txStatus: TransactionStatus.CANCELLED })

    await pollQueue(store)

    await waitFor(() =>
      expect(mockTxDispatch).toHaveBeenCalledWith(TxEvent.FAILED, {
        txId: cancelledId,
        chainId,
        safeAddress,
        nonce: 4,
        groupKey: cancelled.groupKey,
        error: new Error('Another transaction with the same nonce was executed instead.'),
      }),
    )
  })
})
