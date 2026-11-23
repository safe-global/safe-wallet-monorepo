import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistRule } from '../types'
import {
  getPolicyStatus,
  isSpendingLimitPolicy,
  type Policy,
  type PolicyAllowance,
  type PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'

/** `restricted`: it may only send to the allowed recipients; `blocked`: its token is left out of the allowlist. */
export type SpendingLimitImpactKind = 'restricted' | 'blocked'

export type SpendingLimitImpact = {
  /** The row of the active or queued spending limit it comes from. */
  policyId: string
  /** Its transaction is still in the queue. */
  isPending: boolean
  spender: string
  allowance: PolicyAllowance
  impact: SpendingLimitImpactKind
  /** The recipients the allowlist allows for the allowance's token; empty when it is blocked. */
  recipients: string[]
}

const isActiveOrQueued = (policy: Policy): policy is Extract<Policy, { type: 'spending-limit' }> =>
  isSpendingLimitPolicy(policy) &&
  (policy.status === 'pending' ? policy.enabled && policy.operation !== 'remove' : getPolicyStatus(policy) === 'active')

/**
 * How the allowlist changes each active or queued spending limit on `safe`, restricted ones first. The guard denies by
 * default (the setup adds no fallback policy), so an allowance on a token the allowlist leaves out can no longer be spent.
 */
export const getSpendingLimitImpacts = (
  policies: readonly Policy[],
  safe: PolicySafe,
  rules: readonly AllowlistRule[],
): SpendingLimitImpact[] =>
  policies
    .filter(isActiveOrQueued)
    .filter((policy) => policy.safe.chainId === safe.chainId && sameAddress(policy.safe.address, safe.address))
    .flatMap(({ id, status, data }) =>
      data.spenders
        .filter(({ isActive }) => isActive !== false)
        .flatMap(({ spender, allowances }) =>
          allowances
            .filter(({ change }) => change !== 'removed')
            .map((allowance): SpendingLimitImpact => {
              const rule = rules.find(({ tokenAddress }) => sameAddress(tokenAddress, allowance.token.address))
              const source = { policyId: id, isPending: status === 'pending', spender, allowance }

              return rule
                ? { ...source, impact: 'restricted', recipients: rule.recipients }
                : { ...source, impact: 'blocked', recipients: [] }
            }),
        ),
    )
    .sort((a, b) => Number(a.impact === 'blocked') - Number(b.impact === 'blocked'))
