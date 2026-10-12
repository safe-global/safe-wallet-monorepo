import { useMemo } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { markSafeAccountsOffChains } from '../utils/safeAccounts'

export type SpendingLimitChainSets = {
  /** A spending limit can be created: the SPENDING_LIMIT feature is on and an AllowanceModule is deployed. */
  creatable: ReadonlySet<string>
  /** The Policy Indexer reports it afterwards, so the Workspace Policies page can show it. */
  indexed: ReadonlySet<string>
}

export const useSpendingLimitChainSets = (): SpendingLimitChainSets & { isLoading: boolean } => {
  const { configs, loading } = useChains()
  return useMemo(() => {
    const creatableChains = configs.filter(
      (chain) => hasFeature(chain, FEATURES.SPENDING_LIMIT) && !!getLatestSpendingLimitAddress(chain.chainId),
    )
    return {
      isLoading: !!loading,
      creatable: new Set(creatableChains.map((chain) => chain.chainId)),
      indexed: new Set(
        creatableChains
          .filter((chain) => hasFeature(chain, FEATURES.POLICY_INDEXER_SPENDING_LIMIT))
          .map((chain) => chain.chainId),
      ),
    }
  }, [configs, loading])
}

/** `useEligibleSafeAccounts` with no row dropped: a chain that cannot take a limit is disabled with a reason instead. */
export const useSpendingLimitSafeAccounts = () => {
  const eligible = useEligibleSafeAccounts()
  const { creatable, indexed, isLoading: isChainsLoading } = useSpendingLimitChainSets()
  const accounts = useMemo(() => {
    if (isChainsLoading) return []
    const marked = markSafeAccountsOffChains(eligible.accounts, creatable, 'no-spending-limits')
    return markSafeAccountsOffChains(marked, indexed, 'unsupported-chain')
  }, [eligible.accounts, creatable, indexed, isChainsLoading])
  return { ...eligible, accounts, isLoading: eligible.isLoading || isChainsLoading }
}
