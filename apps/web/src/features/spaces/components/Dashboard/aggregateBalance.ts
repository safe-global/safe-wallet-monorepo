import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { sameAddress } from '@safe-global/utils/utils/addresses'

type SafeRef = { chainId: string; address: string }

type Summaries = {
  isEnabled: (chainId: string) => boolean
  getSummary: (chainId: string, address: string) => PortfolioSummary | undefined
}

/**
 * Sums the Workspace balance. A chain with portfolio summaries reads its summary (falling back to the
 * overview when CGW dropped the Safe) and leaves testnets out; any other chain keeps the overview.
 */
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
