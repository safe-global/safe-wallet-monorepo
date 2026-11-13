import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import {
  portfolioSummariesRtkApi,
  refreshPortfolioSummary,
  type PortfolioSummariesForManyArg,
} from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { makeStore, setStoreInstance } from '@/store'
import { makeSafeTag } from '@/store/api/gateway'

const [CHAIN_ID, OTHER_CHAIN_ID] = faker.helpers.uniqueArray(() => faker.string.numeric(3), 2)
const CURRENCY = 'usd'

const summaryOf = (safeId: string) => {
  const [chainId, address] = safeId.split(':')
  return portfolioSummaryBuilder().with({ chainId, address }).build()
}

const serveSummaries = (bySafeId: Map<string, PortfolioSummary>) =>
  server.use(
    http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, ({ request }) => {
      const safeIds = (new URL(request.url).searchParams.get('safes') ?? '').split(',')
      return HttpResponse.json(safeIds.flatMap((safeId) => bySafeId.get(safeId) ?? []))
    }),
  )

describe('refreshPortfolioSummary', () => {
  const setup = async () => {
    const store = makeStore()
    setStoreInstance(store)
    const address = fakerChecksummedAddress()
    const safe = makeSafeTag(CHAIN_ID, address)
    const sameAddressOtherChain = makeSafeTag(OTHER_CHAIN_ID, address)
    const otherSafe = makeSafeTag(CHAIN_ID, fakerChecksummedAddress())
    const listSafes = [sameAddressOtherChain, safe, otherSafe]
    const before = new Map(listSafes.map((safeId) => [safeId, summaryOf(safeId)]))
    serveSummaries(before)

    const listArg = (overrides: Partial<PortfolioSummariesForManyArg> = {}): PortfolioSummariesForManyArg => ({
      safes: listSafes,
      currency: CURRENCY,
      trusted: true,
      ...overrides,
    })
    const { initiate, select } = portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany
    await Promise.all(
      [listArg(), listArg({ trusted: false }), listArg({ currency: 'eur' })].map((arg) =>
        store.dispatch(initiate(arg)),
      ),
    )

    const refresh = () => store.dispatch(refreshPortfolioSummary({ safes: [safe], currency: CURRENCY, trusted: true }))
    const refetchList = () => store.dispatch(initiate(listArg(), { forceRefetch: true }))
    const listData = (overrides?: Partial<PortfolioSummariesForManyArg>) =>
      select(listArg(overrides))(store.getState()).data
    const beforeOf = (safeIds: typeof listSafes) => safeIds.map((safeId) => before.get(safeId))
    return { safe, listSafes, before, refresh, refetchList, listData, beforeOf }
  }

  it('returns the refreshed summaries and writes them into a cached list holding that Safe on that chain', async () => {
    const { safe, listSafes, before, refresh, listData } = await setup()
    const after = summaryOf(safe)
    serveSummaries(new Map([[safe, after]]))

    const refreshed = await refresh()

    expect(refreshed).toEqual([after])
    expect(listData()).toEqual([before.get(listSafes[0]), after, before.get(listSafes[2])])
  })

  it.each([
    ['another trusted value', { trusted: false }],
    ['another currency', { currency: 'eur' }],
  ])('leaves a list with %s as it was', async (_, overrides) => {
    const { safe, listSafes, refresh, listData, beforeOf } = await setup()
    serveSummaries(new Map([[safe, summaryOf(safe)]]))

    await refresh()

    expect(listData(overrides)).toEqual(beforeOf(listSafes))
  })

  it('keeps a newer list value when a later refresh fails', async () => {
    const { safe, before, refresh, refetchList, listData } = await setup()
    serveSummaries(new Map([[safe, summaryOf(safe)]]))
    await refresh()
    const newer = summaryOf(safe)
    serveSummaries(new Map([...before, [safe, newer]]))
    await refetchList()
    server.use(http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, () => new HttpResponse(null, { status: 503 })))

    const refreshed = await refresh()

    expect(refreshed).toBeUndefined()
    expect(listData()).toContainEqual(newer)
  })
})
