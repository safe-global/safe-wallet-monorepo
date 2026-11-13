import { getPolicyTokens as getSpendingLimitTokens } from '@safe-global/views/features/spaces/components/Policies/utils/policyTokens'
import {
  isAllowlistPolicy,
  type Policy,
  type PolicyTokenInfo,
} from '@safe-global/views/features/spaces/components/Policies/types'

/** The distinct tokens across every spender or allowlist entry. A proposer grant governs no tokens. */
export const getPolicyTokens = (policy: Policy): PolicyTokenInfo[] => {
  if (!isAllowlistPolicy(policy)) return getSpendingLimitTokens(policy)

  const byAddress = new Map<string, PolicyTokenInfo>(
    policy.data.entries.map(({ token }) => [token.address.toLowerCase(), token]),
  )
  return [...byAddress.values()]
}
