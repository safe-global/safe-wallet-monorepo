import { useMemo } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { filterSafeAccountsByChains, markSafeAccountsOffChains } from '../utils/safeAccounts'

export type SpendingLimitChainSets = {
  /** A spending limit can be created: the SPENDING_LIMIT feature is on and an AllowanceModule is deployed. */
  creatable: ReadonlySet<string>
  /** The Policy Indexer reports it afterwards, so the Workspace Policies page can show it. */
  indexed: ReadonlySet<string>
}

export const useSpendingLimitChainSets = (): SpendingLimitChainSets => {
  const { configs } = useChains()
  return useMemo(() => {
    const creatableChains = configs.filter(
      (chain) => hasFeature(chain, FEATURES.SPENDING_LIMIT) && !!getLatestSpendingLimitAddress(chain.chainId),
    )
    return {
      creatable: new Set(creatableChains.map((chain) => chain.chainId)),
      indexed: new Set(
        creatableChains
          .filter((chain) => hasFeature(chain, FEATURES.POLICY_INDEXER_SPENDING_LIMIT))
          .map((chain) => chain.chainId),
      ),
    }
  }, [configs])
}

/**
 * `useEligibleSafeAccounts` narrowed to chains where a limit can be created, with the chains the Policy
 * Indexer does not cover left in place but disabled, so the row can say where to set the limit up instead.
 */
export const useSpendingLimitSafeAccounts = () => {
  const eligible = useEligibleSafeAccounts()
  const { creatable, indexed } = useSpendingLimitChainSets()
  const accounts = useMemo(
    () => markSafeAccountsOffChains(filterSafeAccountsByChains(eligible.accounts, creatable), indexed),
    [eligible.accounts, creatable, indexed],
  )
  return { ...eligible, accounts }
}
