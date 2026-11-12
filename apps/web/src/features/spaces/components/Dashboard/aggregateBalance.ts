import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { PortfolioSummaries, SafeRef } from '@/features/portfolio'

type Summaries = Pick<PortfolioSummaries, 'isEnabled' | 'getSummary'>

/** Workspace total: summaries on flagged chains (testnets left out, overview when missing), overviews elsewhere. */
export const aggregateBalance = (
  safes: SafeRef[],
  overviews: SafeOverview[] | undefined,
  summaries: Summaries,
  testnetChainIds: Set<string>,
): number =>
  safes.reduce((total, { chainId, address }) => {
    const usesSummary = summaries.isEnabled(chainId)
    if (usesSummary && testnetChainIds.has(chainId)) return total

    const overview = overviews?.find((o) => o.chainId === chainId && sameAddress(o.address.value, address))
    const fiatTotal =
      (usesSummary ? summaries.getSummary(chainId, address)?.fiatTotal : undefined) ?? overview?.fiatTotal
    return total + Number(fiatTotal ?? 0)
  }, 0)
