import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { txHistoryApi } from '../transactions'
import { setBaseUrl, cgwClient } from '../cgwClient'
import type { TransactionDetails } from '../AUTO_GENERATED/transactions'

const GATEWAY_URL = 'https://test-gateway.safe.global'

const createMockTxDetails = (id: string): TransactionDetails =>
  ({
    txId: id,
    safeAddress: '0xSafe',
    txStatus: 'SUCCESS',
    txInfo: { type: 'Transfer' },
    detailedExecutionInfo: null,
    txData: null,
    txHash: '0xhash',
  }) as unknown as TransactionDetails

type TestStore = ReturnType<
  typeof configureStore<{
    api: ReturnType<typeof cgwClient.reducer>
  }>
>

describe('transactions endpoints', () => {
  let server: ReturnType<typeof setupServer>
  let store: TestStore

  beforeAll(() => {
    setBaseUrl(GATEWAY_URL)
  })

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [cgwClient.reducerPath]: cgwClient.reducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cgwClient.middleware),
    })
  })

  afterEach(() => {
    if (server) {
      server.close()
    }
  })

  describe('transactionsGetMultipleTransactionDetails', () => {
    it('should fetch multiple transaction details in parallel', async () => {
      const tx1 = createMockTxDetails('tx-1')
      const tx2 = createMockTxDetails('tx-2')

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/1/transactions/:id`, ({ params }) => {
          if (params.id === 'tx-1') return HttpResponse.json(tx1)
          if (params.id === 'tx-2') return HttpResponse.json(tx2)
          return new HttpResponse(null, { status: 404 })
        }),
      )
      server.listen()

      const result = await store.dispatch(
        txHistoryApi.endpoints.transactionsGetMultipleTransactionDetails.initiate({
          chainId: '1',
          txIds: ['tx-1', 'tx-2'],
        }),
      )

      expect(result.isSuccess).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]).toMatchObject({ txId: 'tx-1' })
      expect(result.data?.[1]).toMatchObject({ txId: 'tx-2' })
    })

    it('should return error if any request fails', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/1/transactions/:id`, ({ params }) => {
          if (params.id === 'tx-1') return HttpResponse.json(createMockTxDetails('tx-1'))
          return new HttpResponse(null, { status: 500 })
        }),
      )
      server.listen()

      const result = await store.dispatch(
        txHistoryApi.endpoints.transactionsGetMultipleTransactionDetails.initiate({
          chainId: '1',
          txIds: ['tx-1', 'tx-fail'],
        }),
      )

      expect(result.isError).toBe(true)
    })

    it('should handle empty txIds array', async () => {
      server = setupServer()
      server.listen()

      const result = await store.dispatch(
        txHistoryApi.endpoints.transactionsGetMultipleTransactionDetails.initiate({
          chainId: '1',
          txIds: [],
        }),
      )

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle single transaction', async () => {
      const tx = createMockTxDetails('tx-single')

      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/1/transactions/:id`, () => {
          return HttpResponse.json(tx)
        }),
      )
      server.listen()

      const result = await store.dispatch(
        txHistoryApi.endpoints.transactionsGetMultipleTransactionDetails.initiate({
          chainId: '1',
          txIds: ['tx-single'],
        }),
      )

      expect(result.isSuccess).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0]).toMatchObject({ txId: 'tx-single' })
    })

    it('should use correct chain-specific URL', async () => {
      let capturedUrl = ''
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(createMockTxDetails('tx-1'))
        }),
      )
      server.listen()

      await store.dispatch(
        txHistoryApi.endpoints.transactionsGetMultipleTransactionDetails.initiate({
          chainId: '137',
          txIds: ['tx-1'],
        }),
      )

      expect(capturedUrl).toContain('/v1/chains/137/transactions/tx-1')
    })
  })
})
