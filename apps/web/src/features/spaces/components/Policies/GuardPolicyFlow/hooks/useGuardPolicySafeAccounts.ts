import { useMemo } from 'react'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { markSafeAccountsOffChains } from '../../SpendingLimitFlow/utils/safeAccounts'
import { POLICY_ENGINE_DEPLOYMENTS } from '../../shared/policyDeployments'

const POLICY_ENGINE_CHAINS: ReadonlySet<string> = new Set(Object.keys(POLICY_ENGINE_DEPLOYMENTS))

/** `useEligibleSafeAccounts` with no row dropped: a chain without the policy engine is disabled with a reason instead. */
export const useGuardPolicySafeAccounts = () => {
  const eligible = useEligibleSafeAccounts()
  const accounts = useMemo(
    () => markSafeAccountsOffChains(eligible.accounts, POLICY_ENGINE_CHAINS, 'no-policy-engine'),
    [eligible.accounts],
  )
  return { ...eligible, accounts }
}
