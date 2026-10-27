import { useMemo } from 'react'
import useChains from '@/hooks/useChains'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { markSafeAccountsOffChains } from '../../SpendingLimitFlow/utils/safeAccounts'
import { isPolicyEngineChain } from '../../shared/policyDeployments'

/** `useEligibleSafeAccounts` with no row dropped: a chain without the policy engine is disabled with a reason instead. */
export const useGuardPolicySafeAccounts = () => {
  const eligible = useEligibleSafeAccounts()
  const { configs } = useChains()
  const accounts = useMemo(() => {
    const policyEngineChains = new Set(configs.map((chain) => chain.chainId).filter(isPolicyEngineChain))
    return markSafeAccountsOffChains(eligible.accounts, policyEngineChains, 'no-policy-engine')
  }, [eligible.accounts, configs])
  return { ...eligible, accounts }
}
