import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { isSafeEligibleForAllowlist } from '@/features/policy-guard/services'
import type { AllowlistIneligibilityReason } from '@/features/policy-guard/types'
import { flattenSafeAccounts, groupSafeAccounts } from '../../SafeAccountSelector/utils'
import type {
  SafeAccountEntry,
  SafeAccountIneligibility,
} from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'

const INELIGIBILITY_REASONS: Record<AllowlistIneligibilityReason, SafeAccountIneligibility> = {
  'chain-not-enabled': 'no-recipient-allowlists',
  'safe-not-deployed': 'not-activated',
  'version-unsupported': 'unsupported-safe-version',
}

/**
 * Disables, rather than drops, every per-chain entry that cannot take an allowlist; a reason the entry already has is
 * kept. A Safe missing from `versions` (its read failed) stays selectable: the guard check after picking it reports why.
 */
export const markAllowlistIneligibility = (
  entries: readonly SafeAccountEntry[],
  chainsById: ReadonlyMap<string, Pick<Chain, 'chainId' | 'features'>>,
  versions: ReadonlyMap<string, string | null>,
): SafeAccountEntry[] =>
  groupSafeAccounts(
    flattenSafeAccounts([...entries]).map((option) => {
      if (option.ineligibleReason) return option

      const eligibility = isSafeEligibleForAllowlist(
        { version: versions.get(option.id) },
        chainsById.get(option.chainId),
      )
      if (eligibility.eligible) return option
      if (eligibility.reason === 'version-unsupported' && !versions.has(option.id)) return option

      return { ...option, ineligibleReason: INELIGIBILITY_REASONS[eligibility.reason] }
    }),
  )

export const hasSelectableSafeAccount = (entries: readonly SafeAccountEntry[]): boolean =>
  flattenSafeAccounts([...entries]).some((option) => !option.ineligibleReason)
