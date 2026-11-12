import { faker } from '@faker-js/faker'
import { renderHook, fakerChecksummedAddress } from '@/tests/test-utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePortfolioGetSummariesForManyQuery } from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { chainBuilder } from '@/tests/builders/chains'
import useChains from '@/hooks/useChains'
import { initialState as initialSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import usePortfolioSummaries from '../usePortfolioSummaries'

jest.mock('@safe-global/store/gateway/portfolioSummaries', () => ({
  usePortfolioGetSummariesForManyQuery: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockQuery = usePortfolioGetSummariesForManyQuery as jest.Mock
const mockUseChains = useChains as jest.Mock

const SUMMARIES_CHAIN = '1'
const UNTRUSTED_SUMMARIES_CHAIN = '100'
const OTHER_CHAIN = '137'

const summary = (chainId: string, address: string): PortfolioSummary => ({
  chainId,
  address,
  fiatTotal: faker.finance.amount(),
  source: 'zerion',
  snapshot: null,
})

const withTokenList = (tokenList: TOKEN_LISTS) => ({
  initialReduxState: { settings: { ...initialSettings, tokenList } },
})

describe('usePortfolioSummaries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChains.mockReturnValue({
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
    mockQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('requests only the Safes whose chain has the flag, with the trusted value of the default token list', () => {
    const safe = fakerChecksummedAddress()
    const otherSafe = fakerChecksummedAddress()

    renderHook(() =>
      usePortfolioSummaries([
        { chainId: OTHER_CHAIN, address: safe },
        { chainId: SUMMARIES_CHAIN, address: otherSafe },
        { chainId: SUMMARIES_CHAIN, address: safe },
      ]),
    )

    expect(mockQuery).toHaveBeenCalledWith({
      safes: [`${SUMMARIES_CHAIN}:${otherSafe}`, `${SUMMARIES_CHAIN}:${safe}`].sort(),
      currency: 'usd',
      trusted: true,
    })
    expect(mockQuery).toHaveBeenCalledWith(skipToken)
  })

  it('requests trusted=false when the user shows all tokens', () => {
    const safe = fakerChecksummedAddress()

    renderHook(
      () => usePortfolioSummaries([{ chainId: SUMMARIES_CHAIN, address: safe }]),
      withTokenList(TOKEN_LISTS.ALL),
    )

    expect(mockQuery).toHaveBeenCalledWith({ safes: [`${SUMMARIES_CHAIN}:${safe}`], currency: 'usd', trusted: false })
    expect(mockQuery).not.toHaveBeenCalledWith(expect.objectContaining({ trusted: true }))
  })

  it('requests each chain with its own trusted value', () => {
    const safe = fakerChecksummedAddress()

    renderHook(() =>
      usePortfolioSummaries([
        { chainId: SUMMARIES_CHAIN, address: safe },
        { chainId: UNTRUSTED_SUMMARIES_CHAIN, address: safe },
      ]),
    )

    expect(mockQuery).toHaveBeenCalledWith({ safes: [`${SUMMARIES_CHAIN}:${safe}`], currency: 'usd', trusted: true })
    expect(mockQuery).toHaveBeenCalledWith({
      safes: [`${UNTRUSTED_SUMMARIES_CHAIN}:${safe}`],
      currency: 'usd',
      trusted: false,
    })
  })

  it('skips the request when no chain has the flag', () => {
    renderHook(() => usePortfolioSummaries([{ chainId: OTHER_CHAIN, address: fakerChecksummedAddress() }]))

    expect(mockQuery).not.toHaveBeenCalledWith(expect.objectContaining({ safes: expect.anything() }))
  })

  it('reports which chains have the flag', () => {
    const { result } = renderHook(() => usePortfolioSummaries([]))

    expect(result.current.isEnabled(SUMMARIES_CHAIN)).toBe(true)
    expect(result.current.isEnabled(OTHER_CHAIN)).toBe(false)
  })

  it('finds a summary from either request by chain and address, ignoring address case', () => {
    const safe = fakerChecksummedAddress()
    const trustedSummary = summary(SUMMARIES_CHAIN, safe)
    const untrustedSummary = summary(UNTRUSTED_SUMMARIES_CHAIN, safe)
    mockQuery.mockImplementation((args) =>
      args === skipToken
        ? { data: undefined, isLoading: false }
        : { data: [args.trusted ? trustedSummary : untrustedSummary], isLoading: false },
    )

    const { result } = renderHook(() =>
      usePortfolioSummaries([
        { chainId: SUMMARIES_CHAIN, address: safe },
        { chainId: UNTRUSTED_SUMMARIES_CHAIN, address: safe },
      ]),
    )

    expect(result.current.getSummary(SUMMARIES_CHAIN, safe.toLowerCase())).toBe(trustedSummary)
    expect(result.current.getSummary(UNTRUSTED_SUMMARIES_CHAIN, safe)).toBe(untrustedSummary)
    expect(result.current.getSummary(OTHER_CHAIN, safe)).toBeUndefined()
  })

  it('is loading while either request loads', () => {
    mockQuery.mockImplementation((args) => ({ data: undefined, isLoading: args !== skipToken && args.trusted }))

    const { result } = renderHook(() =>
      usePortfolioSummaries([{ chainId: SUMMARIES_CHAIN, address: fakerChecksummedAddress() }]),
    )

    expect(result.current.isLoading).toBe(true)
  })
})
