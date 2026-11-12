import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { makePortfolioSummaryTag, portfolioSummariesRtkApi, PORTFOLIO_SUMMARY_TAG } from '../portfolioSummaries'
import { setBaseUrl, cgwClient } from '../cgwClient'
import type { PortfolioSummary } from '../AUTO_GENERATED/portfolios'

const GATEWAY_URL = 'https://test-gateway.safe.global'
const SUMMARIES_URL = `${GATEWAY_URL}/v2/portfolio/summaries`

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

describe('portfolioGetSummariesForMany', () => {
  const server = setupServer()
  const requests: URLSearchParams[] = []

  beforeAll(() => {
    setBaseUrl(GATEWAY_URL)
    server.listen()
  })
  beforeEach(() => {
    requests.length = 0
    server.use(
      http.get(SUMMARIES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        requests.push(params)
        return HttpResponse.json((params.get('safes') ?? '').split(',').map(toSummary))
      }),
    )
  })
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

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

  it('returns the error of a failed batch', async () => {
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

  it('refetches the entries holding a Safe when its summary tag is invalidated, ignoring address case', async () => {
    const store = makeStore()
    const safe = makeSafeId()
    const otherSafe = makeSafeId()
    const [chainId, address] = safe.split(':')
    const withSafe = store.dispatch(
      portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
        safes: [safe],
        currency: 'usd',
        trusted: true,
      }),
    )
    const withoutSafe = store.dispatch(
      portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
        safes: [otherSafe],
        currency: 'usd',
        trusted: true,
      }),
    )
    await Promise.all([withSafe, withoutSafe])
    requests.length = 0

    store.dispatch(
      portfolioSummariesRtkApi.util.invalidateTags([
        { type: PORTFOLIO_SUMMARY_TAG, id: makePortfolioSummaryTag(chainId, address.toUpperCase()) },
      ]),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(requests.map((params) => params.get('safes'))).toEqual([safe])
    withSafe.unsubscribe()
    withoutSafe.unsubscribe()
  })
})
