import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { POLICY_DEFAULT_FALLBACK } from '@/config/constants'
import { getPolicyDeployments } from './policyDeployments'

/** The policy a first guard setup installs as the fallback, or undefined on a chain without a policy engine. */
export const getDefaultFallbackPolicy = (
  chainId: string,
  fallback: 'allow' | 'deny' = POLICY_DEFAULT_FALLBACK,
): Address | undefined =>
  getPolicyDeployments(chainId)?.policies[fallback === 'deny' ? PolicyType.Deny : PolicyType.Allow]
