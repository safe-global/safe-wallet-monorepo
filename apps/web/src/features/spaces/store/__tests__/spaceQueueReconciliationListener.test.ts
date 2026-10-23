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
  type SpaceQueueSafeItems,
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

const page = (results: SpaceQueueSafeItems[], overrides: Partial<SpaceQueuedItemPage> = {}): SpaceQueuedItemPage => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  ...overrides,
})

const respondWithQueue = (queue: SpaceQueuedItemPage) =>
  server.use(http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, () => HttpResponse.json(queue)))

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

const pollQueue = async (store: TestStore, cursor?: string) => {
  await store.dispatch(spacesApi.endpoints.spaceTransactionsGetTransactionQueueV1.initiate({ spaceId, cursor }))
}

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
    mockTxDispatch.mockClear()
  })

  it('should dispatch SIGNATURE_INDEXED once the signer left the missing signers', async () => {
    const store = makeTestStore()
    const id = txId()
    const signerAddress = faker.finance.ethereumAddress()
    store.dispatch(
      setPendingTx({ txId: id, chainId, safeAddress, nonce: 3, status: PendingStatus.SIGNING, signerAddress }),
    )
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(id, 3, [faker.finance.ethereumAddress()])] }]))

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
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(id, 3, [signerAddress])] }]))

    await pollQueue(store)

    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch SUCCESS for an executed tx that left the queue', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    const txHash = faker.string.hexadecimal({ length: 64 })
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(txId(), 5)] }]))
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

  it.each([TransactionStatus.CANCELLED, TransactionStatus.FAILED])(
    'should clear the pending tx when its details are %s',
    async (txStatus) => {
      const store = makeTestStore()
      const id = txId()
      store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
      respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(txId(), 5)] }]))
      respondWithDetails(id, { txStatus })

      await pollQueue(store)

      await waitFor(() => expect(store.getState().pendingTxs[id]).toBeUndefined())
      expect(mockTxDispatch).not.toHaveBeenCalled()
    },
  )

  it('should do nothing when the entry is gone before the details arrive', async () => {
    const store = makeTestStore()
    const id = txId()
    let requested = false
    store.dispatch(setPendingTx({ txId: id, ...processingTx(4) }))
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(txId(), 5)] }]))
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
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(txId(), 5)] }]))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should leave a pending tx of an unavailable Safe untouched', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(
      page([{ chainId, safeAddress, items: [queuedTx(txId(), 5)] }], { unavailableSafes: [{ chainId, safeAddress }] }),
    )

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
  })

  it('should leave a pending tx untouched while a later page could still hold it', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithSpaceSafes({ [chainId]: [safeAddress] })
    await store.dispatch(spacesApi.endpoints.spaceSafesGetV1.initiate({ spaceId }))
    respondWithQueue(page([], { next: `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued?cursor=abc` }))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
    expect(mockTxDispatch).not.toHaveBeenCalled()
  })

  it('should leave a pending tx untouched while its nonce is still queued', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(txId(), 4)] }]))

    await pollQueue(store)

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
  })

  it('should not settle executions from a later page', async () => {
    const store = makeTestStore()
    const id = txId()
    const pendingTx = processingTx(4)
    store.dispatch(setPendingTx({ txId: id, ...pendingTx }))
    respondWithQueue(page([{ chainId, safeAddress, items: [queuedTx(txId(), 9)] }]))

    await pollQueue(store, 'abc')

    expect(store.getState().pendingTxs[id]).toEqual(pendingTx)
  })
})
