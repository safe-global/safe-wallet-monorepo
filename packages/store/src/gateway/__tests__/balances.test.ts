import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { cgwApi } from '../AUTO_GENERATED/balances'
import { setBaseUrl, cgwClient } from '../cgwClient'
import type { Balances } from '../AUTO_GENERATED/balances'

const GATEWAY_URL = 'https://test-gateway.safe.global'

const mockBalances: Balances = {
  fiatTotal: '1000.00',
  items: [
    {
      balance: '500000000000000000',
      fiatBalance: '1000.00',
      fiatConversion: '2000.00',
      tokenInfo: {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        logoUri: 'https://example.com/eth.png',
        name: 'Ether',
        symbol: 'ETH',
        type: 'NATIVE_TOKEN',
      },
    },
  ],
}

const mockFiatCodes = ['USD', 'EUR', 'GBP']

type TestStore = ReturnType<
  typeof configureStore<{
    api: ReturnType<typeof cgwClient.reducer>
  }>
>

describe('balances endpoints', () => {
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

  describe('balancesGetBalancesV1', () => {
    it('should fetch balances successfully', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/1/safes/0xSafe/balances/USD`, () => {
          return HttpResponse.json(mockBalances)
        }),
      )
      server.listen()

      const result = await store.dispatch(
        cgwApi.endpoints.balancesGetBalancesV1.initiate({
          chainId: '1',
          safeAddress: '0xSafe',
          fiatCode: 'USD',
        }),
      )

      expect(result.isSuccess).toBe(true)
      expect(result.data?.fiatTotal).toBe('1000.00')
      expect(result.data?.items).toHaveLength(1)
      expect(result.data?.items[0].tokenInfo.symbol).toBe('ETH')
    })

    it('should pass query parameters correctly', async () => {
      let capturedUrl = ''
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/1/safes/0xSafe/balances/EUR`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json(mockBalances)
        }),
      )
      server.listen()

      await store.dispatch(
        cgwApi.endpoints.balancesGetBalancesV1.initiate({
          chainId: '1',
          safeAddress: '0xSafe',
          fiatCode: 'EUR',
          trusted: true,
          excludeSpam: true,
        }),
      )

      const url = new URL(capturedUrl)
      expect(url.searchParams.get('trusted')).toBe('true')
      expect(url.searchParams.get('exclude_spam')).toBe('true')
    })

    it('should handle API errors', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/chains/1/safes/0xSafe/balances/USD`, () => {
          return new HttpResponse(null, { status: 500 })
        }),
      )
      server.listen()

      const result = await store.dispatch(
        cgwApi.endpoints.balancesGetBalancesV1.initiate({
          chainId: '1',
          safeAddress: '0xSafe',
          fiatCode: 'USD',
        }),
      )

      expect(result.isError).toBe(true)
    })
  })

  describe('balancesGetSupportedFiatCodesV1', () => {
    it('should fetch supported fiat codes', async () => {
      server = setupServer(
        http.get(`${GATEWAY_URL}/v1/balances/supported-fiat-codes`, () => {
          return HttpResponse.json(mockFiatCodes)
        }),
      )
      server.listen()

      const result = await store.dispatch(cgwApi.endpoints.balancesGetSupportedFiatCodesV1.initiate())

      expect(result.isSuccess).toBe(true)
      expect(result.data).toEqual(['USD', 'EUR', 'GBP'])
    })
  })
})
