import { useMemo } from 'react'
import { isAllowlistEnabled } from '@/features/policy-guard/services'
import useChains from '@/hooks/useChains'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { flattenSafeAccounts } from '../../SafeAccountSelector/utils'
import { hasSelectableSafeAccount, markAllowlistIneligibility } from '../utils/safeAccounts'
import { useSafeVersions } from './useSafeVersions'

const NO_VERSIONS: ReadonlyMap<string, string | null> = new Map()

/** `useEligibleSafeAccounts` with no row dropped: a Safe that cannot take an allowlist is disabled with a reason. */
export const useRecipientAllowlistSafeAccounts = () => {
  const eligible = useEligibleSafeAccounts()
  const { configs, loading: isChainsLoading } = useChains()

  const chainsById = useMemo(() => new Map(configs.map((chain) => [chain.chainId, chain])), [configs])

  // Only a Safe on an enabled chain can be eligible, so only those need their version read.
  const versionedAccounts = useMemo(
    () =>
      flattenSafeAccounts(eligible.accounts).filter((option) => {
        const chain = chainsById.get(option.chainId)
        return !option.ineligibleReason && !!chain && isAllowlistEnabled(chain)
      }),
    [eligible.accounts, chainsById],
  )
  const { versions, isLoading: isVersionsLoading } = useSafeVersions(versionedAccounts)

  const isLoading = eligible.isLoading || !!isChainsLoading || isVersionsLoading

  const accounts = useMemo(
    () => (isLoading ? [] : markAllowlistIneligibility(eligible.accounts, chainsById, versions ?? NO_VERSIONS)),
    [isLoading, eligible.accounts, chainsById, versions],
  )

  return { ...eligible, accounts, isLoading, hasSelectableAccount: hasSelectableSafeAccount(accounts) }
}
