import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistRule } from '../types'
import {
  getPolicyStatus,
  type Policy,
  type PolicyAllowance,
  type PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { isActiveSpendingLimit } from '../../utils/mapPendingPolicies'

/** `restricted`: it may only send to the allowed recipients; `blocked`: its token is left out of the allowlist. */
export type SpendingLimitImpactKind = 'restricted' | 'blocked'

export type SpendingLimitImpact = {
  spender: string
  allowance: PolicyAllowance
  impact: SpendingLimitImpactKind
  /** The recipients the allowlist allows for the allowance's token; empty when it is blocked. */
  recipients: string[]
}

/**
 * How the allowlist changes each active spending limit on `safe`, restricted ones first. The guard denies by default
 * (the setup adds no fallback policy), so an allowance on a token the allowlist leaves out can no longer be spent.
 */
export const getSpendingLimitImpacts = (
  policies: readonly Policy[],
  safe: PolicySafe,
  rules: readonly AllowlistRule[],
): SpendingLimitImpact[] =>
  policies
    .filter(isActiveSpendingLimit)
    .filter((policy) => getPolicyStatus(policy) === 'active')
    .filter((policy) => policy.safe.chainId === safe.chainId && sameAddress(policy.safe.address, safe.address))
    .flatMap(({ data }) =>
      data.spenders
        .filter(({ isActive }) => isActive !== false)
        .flatMap(({ spender, allowances }) =>
          allowances.map((allowance): SpendingLimitImpact => {
            const rule = rules.find(({ tokenAddress }) => sameAddress(tokenAddress, allowance.token.address))

            return rule
              ? { spender, allowance, impact: 'restricted', recipients: rule.recipients }
              : { spender, allowance, impact: 'blocked', recipients: [] }
          }),
        ),
    )
    .sort((a, b) => Number(a.impact === 'blocked') - Number(b.impact === 'blocked'))
