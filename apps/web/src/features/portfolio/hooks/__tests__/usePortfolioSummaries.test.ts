import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { act, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { refreshPortfolioSummary } from '@safe-global/store/gateway/portfolioSummaries'
import { chainBuilder } from '@/tests/builders/chains'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import useChains from '@/hooks/useChains'
import { getStoreInstance } from '@/store'
import { initialState as initialSettings, setCurrency, setTokenList, TOKEN_LISTS } from '@/store/settingsSlice'
import usePortfolioSummaries from '../usePortfolioSummaries'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const SUMMARIES_CHAIN = '1'
const UNTRUSTED_SUMMARIES_CHAIN = '100'
const OTHER_CHAIN = '137'

type SummaryRequest = { safes: string[]; currency: string | null; trusted: string | null }

const totalFor = new Map<string, string>()
const expectedTotal = (trusted: boolean, currency: string, round = 0) => {
  const key = `${trusted}:${currency}:${round}`
  if (!totalFor.has(key)) totalFor.set(key, faker.finance.amount())
  return totalFor.get(key)
}

const serveSummaries = () => {
  const requests: SummaryRequest[] = []
  server.use(
    http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, ({ request }) => {
      const params = new URL(request.url).searchParams
      const current = {
        safes: (params.get('safes') ?? '').split(','),
        currency: params.get('currency'),
        trusted: params.get('trusted'),
      }
      const round = requests.filter((previous) => JSON.stringify(previous) === JSON.stringify(current)).length
      requests.push(current)
      const { safes } = current
      const fiatTotal = expectedTotal(params.get('trusted') === 'true', params.get('currency') ?? '', round)
      return HttpResponse.json(
        safes.map((safeId) => {
          const [chainId, address] = safeId.split(':')
          return portfolioSummaryBuilder().with({ chainId, address, fiatTotal }).build()
        }),
      )
    }),
  )
  return requests
}

const withTokenList = (tokenList: TOKEN_LISTS) => ({
  initialReduxState: { settings: { ...initialSettings, tokenList } },
})

describe('usePortfolioSummaries', () => {
  beforeEach(() => {
    window.localStorage.clear()
    totalFor.clear()
    jest.mocked(useChains).mockReturnValue({
      configs: [
        chainBuilder()
          .with({
            chainId: SUMMARIES_CHAIN,
            features: [FEATURES.PORTFOLIO_SUMMARIES, FEATURES.PORTFOLIO_ENDPOINT, FEATURES.DEFAULT_TOKENLIST],
          })
          .build(),
        chainBuilder()
          .with({ chainId: UNTRUSTED_SUMMARIES_CHAIN, features: [FEATURES.PORTFOLIO_SUMMARIES] })
          .build(),
        chainBuilder().with({ chainId: OTHER_CHAIN, features: [] }).build(),
      ],
    })
  })

  it('requests only the Safes whose chain has the flag, with the trusted value of the default token list', async () => {
    const requests = serveSummaries()
    const safe = fakerChecksummedAddress()
    const otherSafe = fakerChecksummedAddress()

    const { result } = renderHook(() =>
      usePortfolioSummaries([
        { chainId: OTHER_CHAIN, address: safe },
        { chainId: SUMMARIES_CHAIN, address: otherSafe },
        { chainId: SUMMARIES_CHAIN, address: safe },
      ]),
    )

    await waitFor(() => expect(result.current.getSummary(SUMMARIES_CHAIN, safe)).toBeDefined())
    expect(requests).toEqual([
      {
        safes: [`${SUMMARIES_CHAIN}:${otherSafe}`, `${SUMMARIES_CHAIN}:${safe}`].sort(),
        currency: 'usd',
        trusted: 'true',
      },
    ])
    expect(result.current.getSummary(OTHER_CHAIN, safe)).toBeUndefined()
  })

  it('requests each chain with its own trusted value', async () => {
    const requests = serveSummaries()
    const safe = fakerChecksummedAddress()

    const { result } = renderHook(() =>
      usePortfolioSummaries([
        { chainId: SUMMARIES_CHAIN, address: safe },
        { chainId: UNTRUSTED_SUMMARIES_CHAIN, address: safe },
      ]),
    )

    await waitFor(() => expect(result.current.getSummary(UNTRUSTED_SUMMARIES_CHAIN, safe)).toBeDefined())
    expect(requests.map(({ safes, trusted }) => [trusted, safes]).sort()).toEqual([
      ['false', [`${UNTRUSTED_SUMMARIES_CHAIN}:${safe}`]],
      ['true', [`${SUMMARIES_CHAIN}:${safe}`]],
    ])
    expect(result.current.getSummary(SUMMARIES_CHAIN, safe.toLowerCase())?.fiatTotal).toBe(expectedTotal(true, 'usd'))
  })

  it('requests nothing and reports no chain when no chain has the flag', async () => {
    const requests = serveSummaries()

    const { result } = renderHook(() =>
      usePortfolioSummaries([{ chainId: OTHER_CHAIN, address: fakerChecksummedAddress() }]),
    )

    expect(result.current.isEnabled(OTHER_CHAIN)).toBe(false)
    expect(result.current.isEnabled(SUMMARIES_CHAIN)).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(requests).toEqual([])
  })

  it('shows the default token list total, not the cached all-tokens one, after switching back to default tokens', async () => {
    serveSummaries()
    const safe = fakerChecksummedAddress()
    const { result } = renderHook(
      () => usePortfolioSummaries([{ chainId: SUMMARIES_CHAIN, address: safe }]),
      withTokenList(TOKEN_LISTS.ALL),
    )
    await waitFor(() =>
      expect(result.current.getSummary(SUMMARIES_CHAIN, safe)?.fiatTotal).toBe(expectedTotal(false, 'usd')),
    )

    act(() => {
      getStoreInstance().dispatch(setTokenList(TOKEN_LISTS.TRUSTED))
    })

    expect(result.current.getSummary(SUMMARIES_CHAIN, safe)).toBeUndefined()
    await waitFor(() =>
      expect(result.current.getSummary(SUMMARIES_CHAIN, safe)?.fiatTotal).toBe(expectedTotal(true, 'usd')),
    )
  })

  it('is loading, without the old currency total, until the new currency arrives', async () => {
    serveSummaries()
    const safe = fakerChecksummedAddress()
    const { result } = renderHook(() => usePortfolioSummaries([{ chainId: SUMMARIES_CHAIN, address: safe }]))
    await waitFor(() => expect(result.current.getSummary(SUMMARIES_CHAIN, safe)).toBeDefined())

    act(() => {
      getStoreInstance().dispatch(setCurrency('eur'))
    })

    expect(result.current.getSummary(SUMMARIES_CHAIN, safe)).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
    await waitFor(() =>
      expect(result.current.getSummary(SUMMARIES_CHAIN, safe)?.fiatTotal).toBe(expectedTotal(true, 'eur')),
    )
  })

  it('is loading while a newly requested Safe loads, even with another Safe already loaded', async () => {
    serveSummaries()
    const safe = fakerChecksummedAddress()
    const nextSafe = fakerChecksummedAddress()
    const { result, rerender } = renderHook(
      ({ address }) => usePortfolioSummaries([{ chainId: SUMMARIES_CHAIN, address }]),
      {
        initialProps: { address: safe },
      },
    )
    await waitFor(() => expect(result.current.getSummary(SUMMARIES_CHAIN, safe)).toBeDefined())

    rerender({ address: nextSafe })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.getSummary(SUMMARIES_CHAIN, nextSafe)).toBeDefined())
    expect(result.current.isLoading).toBe(false)
  })

  it('shows the newest summary of a Safe in every list that holds it', async () => {
    const requests = serveSummaries()
    const safe = fakerChecksummedAddress()
    const otherSafe = fakerChecksummedAddress()
    const { result } = renderHook(() => ({
      selector: usePortfolioSummaries([
        { chainId: SUMMARIES_CHAIN, address: safe },
        { chainId: SUMMARIES_CHAIN, address: otherSafe },
      ]),
      home: usePortfolioSummaries([{ chainId: SUMMARIES_CHAIN, address: safe }]),
    }))
    await waitFor(() => expect(requests).toHaveLength(2))
    await waitFor(() => expect(result.current.selector.isLoading || result.current.home.isLoading).toBe(false))

    await act(() =>
      getStoreInstance().dispatch(
        refreshPortfolioSummary({ safes: [`${SUMMARIES_CHAIN}:${safe}`], currency: 'usd', trusted: true }),
      ),
    )

    const refreshedTotal = expectedTotal(true, 'usd', 1)
    await waitFor(() => expect(result.current.home.getSummary(SUMMARIES_CHAIN, safe)?.fiatTotal).toBe(refreshedTotal))
    expect(result.current.selector.getSummary(SUMMARIES_CHAIN, safe)?.fiatTotal).toBe(refreshedTotal)
  })
})
