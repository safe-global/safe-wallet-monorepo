import { flattenSafeAccounts, groupSafeAccounts } from '../../SafeAccountSelector/utils'
import type { SafeAccountEntry, SafeAccountIneligibility } from '../../SafeAccountSelector/types'

/** Disables, rather than drops, every per-chain entry off `chainIds`; a reason the entry already has is kept. */
export const markSafeAccountsOffChains = (
  entries: readonly SafeAccountEntry[],
  chainIds: ReadonlySet<string>,
  reason: SafeAccountIneligibility,
): SafeAccountEntry[] =>
  groupSafeAccounts(
    flattenSafeAccounts([...entries]).map((option) =>
      chainIds.has(option.chainId) || option.ineligibleReason ? option : { ...option, ineligibleReason: reason },
    ),
  )
