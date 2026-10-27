import { useMemo } from 'react'
import { PolicyType, type AvailablePolicy } from '@safe-global/store/gateway/policies/types'
import { getPolicyDeployments } from '../shared/policyDeployments'

/**
 * The guard policies a Safe can configure, and the contracts to build each against.
 *
 * Derived locally rather than fetched: CGW has no catalogue route — it reports what a Safe
 * *has* (`/policies/active`), not what it could have — so the set of offerable policies and
 * their contract addresses come from the policy-engine deployments for the chain. A chain
 * with no deployment offers nothing, which is the honest answer.
 */
const GUARD_POLICIES: Array<Omit<AvailablePolicy, 'available' | 'enforcement'>> = [
  {
    type: PolicyType.TokenWithdraw,
    title: 'Token recipient allowlist',
    description: 'Restrict who each token can be sent to.',
    isFallback: false,
  },
  {
    type: PolicyType.MultiSend,
    title: 'Batched transactions',
    description: 'Apply the other policies to every call inside a batch.',
    isFallback: false,
  },
  {
    type: PolicyType.Cosigner,
    title: 'Cosigner',
    description: 'Require an extra signature on the calls you choose.',
    isFallback: false,
  },
  {
    type: PolicyType.Allow,
    title: 'Allow by default',
    description: 'Permit anything no other policy covers.',
    isFallback: true,
  },
  {
    type: PolicyType.NativeTransfer,
    title: 'Native transfers',
    description: 'Govern plain value transfers.',
    isFallback: true,
  },
  {
    type: PolicyType.Deny,
    title: 'Deny by default',
    description: 'Block anything no other policy covers.',
    isFallback: true,
  },
]

export const useAvailablePolicies = (
  chainId: string,
  safeAddress: string,
): { policies: AvailablePolicy[]; isLoading: boolean; isError: boolean; refetch: () => void } => {
  const policies = useMemo<AvailablePolicy[]>(() => {
    const deployments = getPolicyDeployments(chainId)
    if (!deployments || !safeAddress) return []

    return GUARD_POLICIES.flatMap((policy) => {
      const policyContract = deployments.policies[policy.type]
      if (!policyContract) return []

      return [
        {
          ...policy,
          available: true,
          enforcement: {
            via: 'guard' as const,
            guards: { transactionGuard: { policyContract, safePolicyGuard: deployments.safePolicyGuard } },
          },
        },
      ]
    })
  }, [chainId, safeAddress])

  return { policies, isLoading: false, isError: false, refetch: () => {} }
}
