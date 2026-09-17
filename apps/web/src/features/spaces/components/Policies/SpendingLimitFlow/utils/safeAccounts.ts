import { groupSafeAccounts } from '../../SafeAccountSelector/utils'
import { isSafeAccountGroup, type SafeAccountEntry } from '../../SafeAccountSelector/types'

/**
 * Keeps only the per-chain entries on `chainIds`; an ineligible chain is absent, not disabled.
 * Groups are re-formed afterwards so a Safe left with one chain becomes a plain row again.
 */
export const filterSafeAccountsByChains = (
  entries: readonly SafeAccountEntry[],
  chainIds: ReadonlySet<string>,
): SafeAccountEntry[] => {
  const options = entries.flatMap((entry) => (isSafeAccountGroup(entry) ? entry.accounts : [entry]))
  return groupSafeAccounts(options.filter((option) => chainIds.has(option.chainId)))
}
