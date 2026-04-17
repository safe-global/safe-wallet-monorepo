import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

/**
 * Picks the deployed Safe instance to open for a multi-chain account:
 * highest fiat balance from overviews; falls back to the first sorted safe.
 */
export const getMultiChainNavigationSafe = (
  sortedSafes: SafeItem[],
  safeOverviews: SafeOverview[] | undefined,
): SafeItem | undefined => {
  const first = sortedSafes[0]
  if (!first) {
    return undefined
  }
  if (!safeOverviews?.length) {
    return first
  }

  let best: SafeItem = first
  let bestFiat = -Infinity

  for (const overview of safeOverviews) {
    const fiat = Number(overview.fiatTotal ?? 0)
    const match = sortedSafes.find(
      (s) => s.chainId === overview.chainId && sameAddress(s.address, overview.address.value),
    )
    if (match && fiat > bestFiat) {
      bestFiat = fiat
      best = match
    }
  }

  return best
}
