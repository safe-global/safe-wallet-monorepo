import { flattenSafeAccounts, groupSafeAccounts } from '../../SafeAccountSelector/utils'
import type { SafeAccountEntry, SafeAccountIneligibility } from '../../SafeAccountSelector/types'

/** Disables, rather than drops, every per-chain entry off `chainIds`; `reason` wins over any the entry already has. */
export const markSafeAccountsOffChains = (
  entries: readonly SafeAccountEntry[],
  chainIds: ReadonlySet<string>,
  reason: SafeAccountIneligibility = 'unsupported-chain',
): SafeAccountEntry[] =>
  groupSafeAccounts(
    flattenSafeAccounts([...entries]).map((option) =>
      chainIds.has(option.chainId) ? option : { ...option, ineligibleReason: reason },
    ),
  )
