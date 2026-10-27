import type { Address } from 'viem'
import type { PolicyType } from '@safe-global/store/gateway/policies/types'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { usePolicyContracts } from '../../shared/usePolicyContracts'
import { usePolicyGuard } from '../../hooks/usePolicyGuard'
import { getDefaultFallbackPolicy } from '../../shared/defaultFallbackPolicy'
import { getDefaultMultiSend, type MultiSendDefaults } from '../../shared/defaultMultiSend'

export type GuardPolicyContracts = {
  chainId: string
  safeAddress: Address | undefined
  safePolicyGuard: Address | undefined
  policyContract: Address | undefined
  /** The policy a first setup installs as the fallback. */
  fallbackPolicy: Address | undefined
  /** The MultiSendPolicy a first setup binds every official MultiSendCallOnly to. */
  multiSendDefaults: MultiSendDefaults | undefined
  currentGuard: Address | undefined
  currentModuleGuard: Address | undefined
  /** The policy guard is already the Safe's guard, so the change is requested rather than applied. */
  isGuardSet: boolean
  /** Another guard is installed and the batch replaces it. */
  isUnknownGuard: boolean
  /** The Safe predates v1.5.0, so it has no module guard slot for the policy guard. */
  isUnsupportedVersion: boolean
  isLoading: boolean
  /** The module guard couldn't be read, so whether to apply or request the change is unknown. */
  guardError?: Error
}

/** What every guard policy builds against, for the Safe the flow is scoped to. */
export const useGuardPolicyContracts = (type: PolicyType): GuardPolicyContracts => {
  const scope = useSafeScope()
  const chainId = scope?.chainId ?? ''
  const safeAddress = scope?.safeAddress ?? ''
  const { safePolicyGuard, policyContract } = usePolicyContracts(chainId, safeAddress, type)
  const { currentGuard, currentModuleGuard, isSet, isUnknownGuard, isUnsupportedVersion, isLoading, error } =
    usePolicyGuard(chainId, safeAddress, safePolicyGuard)

  return {
    chainId,
    safeAddress: (safeAddress || undefined) as Address | undefined,
    safePolicyGuard: safePolicyGuard as Address | undefined,
    policyContract: policyContract as Address | undefined,
    fallbackPolicy: getDefaultFallbackPolicy(chainId),
    multiSendDefaults: getDefaultMultiSend(chainId),
    currentGuard: currentGuard as Address | undefined,
    currentModuleGuard: currentModuleGuard as Address | undefined,
    isGuardSet: isSet,
    isUnknownGuard,
    isUnsupportedVersion,
    isLoading,
    guardError: error,
  }
}
