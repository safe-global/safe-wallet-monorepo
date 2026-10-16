import type { Address } from 'viem'
import { NO_POLICY_CONTRACTS_ERROR } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import type { PolicyBatch, PolicyBatchContext } from '../shared/buildPolicyBatch'
import type { GuardPolicyContracts } from './hooks/useGuardPolicyContracts'
import type { GuardPolicyBuild } from './hooks/useBuildGuardPolicyTransaction'

/**
 * Runs a policy's pure batch builder once everything it needs is known.
 *
 * Nothing is built while the Safe's guard is loading: the guard decides between applying the change now and
 * requesting it, so a batch built without it could be the wrong one. A builder's own throw (an invalid address,
 * an empty configuration) becomes the review's error rather than a crash.
 */
export const buildGuardPolicy = (
  contracts: GuardPolicyContracts,
  build: (context: PolicyBatchContext, policyContract: Address) => PolicyBatch,
): GuardPolicyBuild => {
  const { safeAddress, safePolicyGuard, policyContract, currentGuard, isUnknownGuard, isLoading } = contracts
  if (!safeAddress || isLoading) return {}
  if (!safePolicyGuard || !policyContract) return { error: new Error(NO_POLICY_CONTRACTS_ERROR) }

  try {
    return {
      batch: build(
        // The review warns before a foreign guard is replaced; confirming it is the consent.
        { safeAddress, currentGuard, safePolicyGuard, allowOverwriteGuard: isUnknownGuard },
        policyContract,
      ),
    }
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}
