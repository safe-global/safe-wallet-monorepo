import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { portfolioSummariesRtkApi, refreshPortfolioSummary } from '../portfolioSummaries'
import { setBaseUrl, cgwClient } from '../cgwClient'
import { cgwApi as portfoliosApi, type PortfolioSummary } from '../AUTO_GENERATED/portfolios'

const GATEWAY_URL = 'https://test-gateway.safe.global'
const SUMMARIES_URL = `${GATEWAY_URL}/v2/portfolio/summaries`
const PORTFOLIO_URL = `${GATEWAY_URL}/v1/portfolio/:address`

const makeSafeId = () => `1:${faker.finance.ethereumAddress()}`

const toSummary = (safeId: string): PortfolioSummary => {
  const [chainId, address] = safeId.split(':')
  return { chainId, address, fiatTotal: faker.finance.amount(), source: 'tx_service', snapshot: null }
}

const makeStore = () =>
  configureStore({
    reducer: { [cgwClient.reducerPath]: cgwClient.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cgwClient.middleware),
  })

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe('portfolio summaries endpoints', () => {
  const server = setupServer()
  const requests: URLSearchParams[] = []
  const portfolioReads: string[] = []

  beforeAll(() => {
    setBaseUrl(GATEWAY_URL)
    server.listen()
  })
  beforeEach(() => {
    requests.length = 0
    portfolioReads.length = 0
    server.use(
      http.get(SUMMARIES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        requests.push(params)
        return HttpResponse.json((params.get('safes') ?? '').split(',').map(toSummary))
      }),
      http.get(PORTFOLIO_URL, ({ params }) => {
        portfolioReads.push(String(params.address))
        return HttpResponse.json({})
      }),
    )
  })
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('portfolioGetSummariesForMany', () => {
    it('requests the Safes in batches of 10 and concatenates the results', async () => {
      const safes = Array.from({ length: 23 }, makeSafeId)

      const result = await makeStore().dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
          safes,
          currency: 'usd',
          trusted: true,
        }),
      )

      expect(requests.map((params) => params.get('safes')?.split(',').length)).toEqual([10, 10, 3])
      expect(result.data?.map((summary) => `${summary.chainId}:${summary.address}`)).toEqual(safes)
    })

    it.each([true, false])('sends currency and trusted=%s on every batch', async (trusted) => {
      const safes = Array.from({ length: 11 }, makeSafeId)

      await makeStore().dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({ safes, currency: 'eur', trusted }),
      )

      expect(requests.map((params) => [params.get('currency'), params.get('trusted')])).toEqual([
        ['eur', String(trusted)],
        ['eur', String(trusted)],
      ])
    })

    it('keeps the batches that succeeded when another batch fails', async () => {
      const safes = Array.from({ length: 13 }, makeSafeId)
      const failingBatch = safes.slice(0, 10).join(',')
      server.use(
        http.get(SUMMARIES_URL, ({ request }) => {
          const batch = new URL(request.url).searchParams.get('safes') ?? ''
          if (batch === failingBatch) return HttpResponse.json({ message: 'Too many requests' }, { status: 429 })
          return HttpResponse.json(batch.split(',').map(toSummary))
        }),
      )

      const result = await makeStore().dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
          safes,
          currency: 'usd',
          trusted: true,
        }),
      )

      expect(result.data?.map((summary) => `${summary.chainId}:${summary.address}`)).toEqual(safes.slice(10))
    })

    it('returns the error when every batch fails', async () => {
      server.use(http.get(SUMMARIES_URL, () => HttpResponse.json({ message: 'Too many requests' }, { status: 429 })))

      const result = await makeStore().dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
          safes: [makeSafeId()],
          currency: 'usd',
          trusted: true,
        }),
      )

      expect(result.error).toMatchObject({ status: 429 })
      expect(result.data).toBeUndefined()
    })
  })

  describe('portfolioClearForSummary', () => {
    it('sends the chainId and refetches neither the portfolio nor any summaries list', async () => {
      const store = makeStore()
      const address = faker.finance.ethereumAddress()
      const chainId = faker.string.numeric(3)
      const clears: Array<string | null> = []
      server.use(
        http.delete(PORTFOLIO_URL, ({ request }) => {
          clears.push(new URL(request.url).searchParams.get('chainId'))
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const portfolio = store.dispatch(portfoliosApi.endpoints.portfolioGetPortfolioV1.initiate({ address }))
      const summaries = store.dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
          safes: [`${chainId}:${address}`],
          currency: 'usd',
          trusted: true,
        }),
      )
      await Promise.all([portfolio, summaries])

      await store.dispatch(portfolioSummariesRtkApi.endpoints.portfolioClearForSummary.initiate({ address, chainId }))
      await settle()

      expect(clears).toEqual([chainId])
      expect(portfolioReads).toHaveLength(1)
      expect(requests).toHaveLength(1)
      portfolio.unsubscribe()
      summaries.unsubscribe()
    })
  })

  describe('refreshPortfolioSummary', () => {
    it('refetches the given Safes even when their summary is cached, and only them', async () => {
      const store = makeStore()
      const safe = makeSafeId()
      const listedSafes = [safe, makeSafeId()]
      const list = store.dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
          safes: listedSafes,
          currency: 'usd',
          trusted: true,
        }),
      )
      await list
      await store.dispatch(refreshPortfolioSummary({ safes: [safe], currency: 'usd', trusted: true }))

      await store.dispatch(refreshPortfolioSummary({ safes: [safe], currency: 'usd', trusted: true }))

      expect(requests.map((params) => params.get('safes'))).toEqual([listedSafes.join(','), safe, safe])
      list.unsubscribe()
    })
  })
})
