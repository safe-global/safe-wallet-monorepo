import type { Address } from 'viem'
import {
  GUARD_READ_ERROR,
  NO_POLICY_CONTRACTS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { INELIGIBILITY_TEXT } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/constants'
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
  const {
    safeAddress,
    safePolicyGuard,
    policyContract,
    fallbackPolicy,
    currentGuard,
    currentModuleGuard,
    isUnknownGuard,
    isUnsupportedVersion,
    isLoading,
    guardError,
  } = contracts
  if (!safeAddress || isLoading) return {}
  if (isUnsupportedVersion) return { error: new Error(INELIGIBILITY_TEXT['unsupported-safe-version']) }
  if (guardError) return { error: new Error(GUARD_READ_ERROR) }
  if (!safePolicyGuard || !policyContract) return { error: new Error(NO_POLICY_CONTRACTS_ERROR) }

  try {
    return {
      batch: build(
        // The review warns before a foreign guard is replaced; confirming it is the consent.
        {
          safeAddress,
          currentGuard,
          currentModuleGuard,
          safePolicyGuard,
          fallbackPolicy,
          allowOverwriteGuard: isUnknownGuard,
        },
        policyContract,
      ),
    }
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}
