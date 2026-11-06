import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { portfolioSummariesRtkApi } from '../portfolioSummaries'
import { setBaseUrl, cgwClient } from '../cgwClient'
import type { PortfolioSummary } from '../AUTO_GENERATED/portfolios'

const GATEWAY_URL = 'https://test-gateway.safe.global'
const SUMMARIES_URL = `${GATEWAY_URL}/v2/portfolio/summaries`

const makeSafeId = (index: number) => `1:0x${index.toString(16).padStart(40, '0')}`

const toSummary = (safeId: string): PortfolioSummary => {
  const [chainId, address] = safeId.split(':')
  return { chainId, address, fiatTotal: '1', source: 'tx_service', snapshot: null }
}

const makeStore = () =>
  configureStore({
    reducer: { [cgwClient.reducerPath]: cgwClient.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cgwClient.middleware),
  })

describe('portfolioGetSummariesForMany', () => {
  const server = setupServer()

  beforeAll(() => {
    setBaseUrl(GATEWAY_URL)
    server.listen()
  })
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('requests the Safes in batches of 10 and concatenates the results', async () => {
    const requests: URLSearchParams[] = []
    server.use(
      http.get(SUMMARIES_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        requests.push(params)
        return HttpResponse.json(params.get('safes')!.split(',').map(toSummary))
      }),
    )
    const safes = Array.from({ length: 23 }, (_, i) => makeSafeId(i))

    const result = await makeStore().dispatch(
      portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({ safes, currency: 'usd' }),
    )

    expect(requests.map((params) => params.get('safes')!.split(',').length)).toEqual([10, 10, 3])
    expect(requests.every((params) => params.get('currency') === 'usd')).toBe(true)
    expect(result.data?.map((summary) => `${summary.chainId}:${summary.address}`)).toEqual(safes)
  })

  it('returns the error of a failed batch', async () => {
    server.use(http.get(SUMMARIES_URL, () => HttpResponse.json({ message: 'Too many requests' }, { status: 429 })))

    const result = await makeStore().dispatch(
      portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
        safes: [makeSafeId(1)],
        currency: 'usd',
      }),
    )

    expect(result.error).toMatchObject({ status: 429 })
    expect(result.data).toBeUndefined()
  })
})
