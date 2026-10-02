import { flattenSafeAccounts, groupSafeAccounts } from '../../SafeAccountSelector/utils'
import type { SafeAccountEntry } from '../../SafeAccountSelector/types'

/**
 * Keeps only the per-chain entries on `chainIds`; an ineligible chain is absent, not disabled.
 * Groups are re-formed afterwards so a Safe left with one chain becomes a plain row again.
 */
export const filterSafeAccountsByChains = (
  entries: readonly SafeAccountEntry[],
  chainIds: ReadonlySet<string>,
): SafeAccountEntry[] =>
  groupSafeAccounts(flattenSafeAccounts([...entries]).filter((option) => chainIds.has(option.chainId)))

/** Disables, rather than drops, every per-chain entry off `chainIds`; the network reason wins over any other. */
export const markSafeAccountsOffChains = (
  entries: readonly SafeAccountEntry[],
  chainIds: ReadonlySet<string>,
): SafeAccountEntry[] =>
  groupSafeAccounts(
    flattenSafeAccounts([...entries]).map((option) =>
      chainIds.has(option.chainId) ? option : { ...option, ineligibleReason: 'unsupported-chain' as const },
    ),
  )
