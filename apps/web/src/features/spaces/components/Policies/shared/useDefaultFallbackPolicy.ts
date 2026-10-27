import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { getPolicyDeployments } from './policyDeployments'

/** The AllowPolicy a first guard setup installs as the fallback, or undefined while the chain's flag is off. */
export const useDefaultFallbackPolicy = (chainId: string): Address | undefined => {
  const chain = useChain(chainId)
  if (!chain || !hasFeature(chain, FEATURES.POLICY_DEFAULT_ALLOW_FALLBACK)) return undefined
  return getPolicyDeployments(chainId)?.policies[PolicyType.Allow]
}
