import type { DesiredAllowance, SpendingLimitState } from '@/features/spending-limits'
import { isSpendingLimitFor } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { findTokenOption, type TokenOption } from '../utils/tokenOptions'

export const UNKNOWN_TOKEN_IN_POLICY_ERROR = 'A token in this policy could not be resolved. Go back and pick it again.'

/** Either every row resolved, or the first reason none of them can be. */
export type DesiredAllowancesResult =
  { desired: DesiredAllowance[]; error?: undefined } | { desired?: undefined; error: Error }

/**
 * Turns the form into the flat list the transaction builders take.
 *
 * @param values - The form as it stands.
 * @param tokens - The options the token selector offered, which carry the decimals.
 * @returns `{ desired }` with one entry per spender and token, or `{ error }` if a row names a token
 *   no longer among the options — its decimals are then unknown and no amount can be converted.
 */
export const buildDesiredAllowances = (
  values: SpendingLimitPolicyFormValues,
  tokens: readonly TokenOption[],
): DesiredAllowancesResult => {
  const desired: DesiredAllowance[] = []

  for (const spender of values.spenders) {
    for (const limit of spender.limits) {
      const token = findTokenOption(tokens, limit.tokenAddress)
      if (!token) return { error: new Error(UNKNOWN_TOKEN_IN_POLICY_ERROR) }

      desired.push({
        beneficiary: spender.address,
        tokenAddress: limit.tokenAddress,
        amount: limit.amount,
        decimals: token.decimals,
        resetTime: limit.resetTime,
      })
    }
  }

  return { desired }
}

/**
 * @returns The first desired allowance the Safe already holds, if any — changing that one is the
 *   edit flow's job, so the create flow refuses it.
 */
export const findExistingAllowance = (
  desired: readonly DesiredAllowance[],
  existing: readonly SpendingLimitState[],
): DesiredAllowance | undefined =>
  desired.find((allowance) =>
    existing.some((limit) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress)),
  )
