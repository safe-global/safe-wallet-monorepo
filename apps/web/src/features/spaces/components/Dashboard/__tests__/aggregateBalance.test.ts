import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { portfolioSummaryBuilder } from '@/tests/builders/portfolioSummary'
import { aggregateBalance } from '../aggregateBalance'

const SAFE = fakerChecksummedAddress()

const overview = (chainId: string, fiatTotal: string) =>
  ({ chainId, address: { value: SAFE }, fiatTotal }) as unknown as SafeOverview

const summary = (chainId: string, fiatTotal: string): PortfolioSummary =>
  portfolioSummaryBuilder().with({ chainId, address: SAFE, fiatTotal }).build()

const makeSummaries = (enabledChainIds: string[], items: PortfolioSummary[]) => ({
  isEnabled: (chainId: string) => enabledChainIds.includes(chainId),
  getSummary: (chainId: string) => items.find((item) => item.chainId === chainId),
})

const TESTNETS = new Set(['11155111'])
const safes = [
  { chainId: '1', address: SAFE },
  { chainId: '137', address: SAFE },
  { chainId: '11155111', address: SAFE },
]
const overviews = [overview('1', '100'), overview('137', '50'), overview('11155111', '7')]

describe('aggregateBalance', () => {
  it('sums every overview, testnets included, when no chain has the flag', () => {
    expect(aggregateBalance(safes, overviews, makeSummaries([], []), TESTNETS)).toBe(157)
  })

  it('reads the summary on flagged chains and the overview elsewhere', () => {
    const summaries = makeSummaries(['1'], [summary('1', '120'), summary('137', '999')])

    expect(aggregateBalance(safes, overviews, summaries, TESTNETS)).toBe(120 + 50 + 7)
  })

  it('leaves testnets out on flagged chains', () => {
    const summaries = makeSummaries(['1', '11155111'], [summary('1', '120'), summary('11155111', '7')])

    expect(aggregateBalance(safes, overviews, summaries, TESTNETS)).toBe(120 + 50)
  })

  it('falls back to the overview when the Safe is missing from the summaries', () => {
    expect(aggregateBalance(safes, overviews, makeSummaries(['1'], []), TESTNETS)).toBe(157)
  })

  it('counts nothing for a Safe with neither an overview nor a summary', () => {
    expect(aggregateBalance(safes, undefined, makeSummaries([], []), TESTNETS)).toBe(0)
  })
})
