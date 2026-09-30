import { useMemo } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { filterSafeAccountsByChains } from '../utils/safeAccounts'

/** Chains where a spending limit can be created: the SPENDING_LIMIT feature is on and an AllowanceModule is deployed. */
export const useSpendingLimitChainIds = (): ReadonlySet<string> => {
  const { configs } = useChains()
  return useMemo(
    () =>
      new Set(
        configs
          .filter(
            (chain) => hasFeature(chain, FEATURES.SPENDING_LIMIT) && !!getLatestSpendingLimitAddress(chain.chainId),
          )
          .map((chain) => chain.chainId),
      ),
    [configs],
  )
}

/** `useEligibleSafeAccounts` narrowed to the chains that support spending limits. */
export const useSpendingLimitSafeAccounts = () => {
  const eligible = useEligibleSafeAccounts()
  const chainIds = useSpendingLimitChainIds()
  const accounts = useMemo(() => filterSafeAccountsByChains(eligible.accounts, chainIds), [eligible.accounts, chainIds])
  return { ...eligible, accounts }
}
