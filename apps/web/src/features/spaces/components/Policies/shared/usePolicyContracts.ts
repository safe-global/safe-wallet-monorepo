import { useMemo } from 'react'
import type { ActivePolicy, AvailablePolicy, PolicyType } from '@safe-global/store/gateway/policies/types'
import { useAvailablePolicies } from '../hooks/useAvailablePolicies'
import { useActivePolicies } from '../hooks/useActivePolicies'
import { getPolicyDeployments } from './policyDeployments'

export type ResolvedPolicyContracts = {
  safePolicyGuard?: string
  policyContract?: string
}

/**
 * The SafePolicyGuard + policy contract addresses to build a policy of `type` against.
 *
 * Three sources, most authoritative first:
 *  1. the CGW catalogue entry for this Safe,
 *  2. the Safe's active policy of the same type, which carries the live addresses,
 *  3. the policy-engine deployments for the chain.
 *
 * The fallback is not belt-and-braces: CGW has no catalogue route yet and does not know
 * MultiSendPolicy at all, so a Safe with nothing configured has no CGW answer to build
 * against. All three empty means the policy engine isn't available for this chain.
 */
export const usePolicyContracts = (chainId: string, safeAddress: string, type: PolicyType): ResolvedPolicyContracts => {
  const { policies: catalogue } = useAvailablePolicies(chainId, safeAddress)
  const { policies: active } = useActivePolicies(chainId, safeAddress)

  return useMemo(() => {
    const enforcements = [
      catalogue.find((policy: AvailablePolicy) => policy.type === type)?.enforcement,
      active.find((policy: ActivePolicy) => policy.type === type)?.enforcement,
    ]
    const guardEnforcement = enforcements.find((enforcement) => enforcement?.via === 'guard')
    const reported = guardEnforcement?.via === 'guard' ? guardEnforcement.guards.transactionGuard : undefined

    if (reported?.safePolicyGuard && reported?.policyContract) return reported

    const deployments = getPolicyDeployments(chainId)

    return {
      safePolicyGuard: reported?.safePolicyGuard ?? deployments?.safePolicyGuard,
      policyContract: reported?.policyContract ?? deployments?.policies[type],
    }
  }, [catalogue, active, chainId, type])
}
