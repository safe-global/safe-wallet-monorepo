import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistRule } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import {
  isSpendingLimitPolicy,
  type Policy,
  type PolicyAllowance,
  type PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'

export type SpendingLimitImpact = {
  spender: string
  allowance: PolicyAllowance
  /** The allowlist covers the allowance's token, so the spender may only send it to `recipients`. */
  restricted: boolean
  recipients: string[]
}

/**
 * How the allowlist changes each spending limit on `safe`. With the AllowPolicy fallback, a token the allowlist leaves
 * out stays unrestricted, so only an allowance on an allowlisted token is affected.
 */
export const getSpendingLimitImpacts = (
  policies: readonly Policy[],
  safe: PolicySafe,
  rules: readonly AllowlistRule[],
): SpendingLimitImpact[] =>
  policies
    .filter(isSpendingLimitPolicy)
    .filter(
      (policy) =>
        policy.status === 'active' &&
        policy.safe.chainId === safe.chainId &&
        sameAddress(policy.safe.address, safe.address),
    )
    .flatMap(({ data }) =>
      data.spenders.flatMap(({ spender, allowances }) =>
        allowances.map((allowance) => {
          const rule = rules.find(({ tokenAddress }) => sameAddress(tokenAddress, allowance.token.address))

          return { spender, allowance, restricted: !!rule, recipients: rule?.recipients ?? [] }
        }),
      ),
    )

export const hasRestrictedSpendingLimit = (impacts: readonly SpendingLimitImpact[]): boolean =>
  impacts.some(({ restricted }) => restricted)
