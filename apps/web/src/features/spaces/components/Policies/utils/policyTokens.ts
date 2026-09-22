import { hasSpendingLimitData, type Policy, type PolicyTokenInfo } from '../types'

/** The distinct tokens across every spender. A proposer grant governs no tokens. */
export const getPolicyTokens = (policy: Policy): PolicyTokenInfo[] => {
  if (!hasSpendingLimitData(policy)) return []

  const byAddress = new Map<string, PolicyTokenInfo>()
  for (const spender of policy.data.spenders) {
    for (const { token } of spender.allowances) {
      byAddress.set(token.address.toLowerCase(), token)
    }
  }

  return [...byAddress.values()]
}
