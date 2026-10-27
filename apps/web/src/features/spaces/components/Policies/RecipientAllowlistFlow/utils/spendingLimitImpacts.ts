import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistRule } from '../types'
import {
  isSpendingLimitPolicy,
  type Policy,
  type PolicyAllowance,
  type PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'

/** `blocked`: its token is left out of the allowlist; `restricted`: it may only send to the allowed recipients. */
export type SpendingLimitImpactKind = 'blocked' | 'restricted'

export type SpendingLimitImpact = {
  spender: string
  allowance: PolicyAllowance
  impact: SpendingLimitImpactKind
  /** The recipients the allowlist allows for the allowance's token; empty when it is blocked. */
  recipients: string[]
}

/**
 * How the allowlist changes each active spending limit on `safe`. The guard denies by default (the setup adds no
 * fallback policy), so an allowance on a token the allowlist leaves out can no longer be spent at all.
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
      data.spenders
        .filter(({ isActive }) => isActive !== false)
        .flatMap(({ spender, allowances }) =>
          allowances.map((allowance) => {
            const rule = rules.find(({ tokenAddress }) => sameAddress(tokenAddress, allowance.token.address))

            return rule
              ? { spender, allowance, impact: 'restricted' as const, recipients: rule.recipients }
              : { spender, allowance, impact: 'blocked' as const, recipients: [] }
          }),
        ),
    )
