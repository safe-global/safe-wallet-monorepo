import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistRule } from '../types'
import {
  getPolicyStatus,
  type Policy,
  type PolicyAllowance,
  type PolicySafe,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { isActiveSpendingLimit } from '../../utils/mapPendingPolicies'

/** `restricted`: it may only send to the allowed recipients; `unaffected`: its token is left out of the allowlist. */
export type SpendingLimitImpactKind = 'restricted' | 'unaffected'

export type SpendingLimitImpact = {
  spender: string
  allowance: PolicyAllowance
  impact: SpendingLimitImpactKind
  /** The recipients the allowlist allows for the allowance's token; empty when it is unaffected. */
  recipients: string[]
}

/**
 * How the allowlist changes each active spending limit on `safe`, restricted ones first. The setup's Allow fallback
 * lets an allowance on a token the allowlist leaves out be spent as before.
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
              : { spender, allowance, impact: 'unaffected', recipients: [] }
          }),
        ),
    )
    .sort((a, b) => Number(a.impact === 'unaffected') - Number(b.impact === 'unaffected'))
