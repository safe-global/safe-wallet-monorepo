import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import useChains, { useChain, useCurrentChain, useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { balanceBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import Overview from './Overview'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(),
}))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useVisibleBalances', () => ({ useVisibleBalances: jest.fn() }))
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({ PortfolioRefreshHint: () => null, ActionsTray: () => null }),
}))

const normalize = (text: string | null | undefined) => text?.replace(/\s/g, ' ')

const BALANCES_TOTAL = faker.finance.amount({ min: 1, max: 999 })
const SUMMARY_TOTAL = faker.finance.amount({ min: 1000, max: 9999 })

const setup = (features: FEATURES[]) => {
  const chain = chainBuilder().with({ features }).build()
  const safe = extendedSafeInfoBuilder().with({ chainId: chain.chainId, deployed: true }).build()
  jest.mocked(useChains).mockReturnValue({ configs: [chain] })
  jest.mocked(useChain).mockReturnValue(chain)
  jest.mocked(useCurrentChain).mockReturnValue(chain)
  jest.mocked(useHasFeature).mockImplementation((feature) => features.includes(feature))
  jest.mocked(useSafeInfo).mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
    safeError: undefined,
  })
  jest.mocked(useVisibleBalances).mockReturnValue({
    balances: { fiatTotal: BALANCES_TOTAL, items: [balanceBuilder().build()] },
    loaded: true,
    loading: false,
    error: undefined,
  })
  const summaryRequests: Array<string | null> = []
  server.use(
    http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, ({ request }) => {
      summaryRequests.push(new URL(request.url).searchParams.get('safes'))
      return HttpResponse.json([
        portfolioSummaryBuilder()
          .with({ chainId: chain.chainId, address: safe.address.value, fiatTotal: SUMMARY_TOTAL })
          .build(),
      ])
    }),
  )
  return summaryRequests
}

describe('Overview', () => {
  it('shows the portfolio summary as the total balance when the chain has PORTFOLIO_SUMMARIES', async () => {
    setup([FEATURES.PORTFOLIO_SUMMARIES])

    const { container } = render(<Overview />)

    await waitFor(() =>
      expect(normalize(container.textContent)).toContain(normalize(formatCurrencyPrecise(SUMMARY_TOTAL, 'usd'))),
    )
    expect(screen.getByText('Total balance')).toBeInTheDocument()
  })

  it('shows the balances total and requests no summary when the chain has the flag off', async () => {
    const summaryRequests = setup([])

    const { container } = render(<Overview />)

    expect(normalize(container.textContent)).toContain(normalize(formatCurrencyPrecise(BALANCES_TOTAL, 'usd')))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(summaryRequests).toEqual([])
  })
})
