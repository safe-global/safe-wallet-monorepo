import type { DesiredAllowance, SpendingLimitState } from '@/features/spending-limits'
import { isSpendingLimitFor } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { findTokenOption, type TokenOption } from '../utils/tokenOptions'

export const UNKNOWN_TOKEN_IN_POLICY_ERROR = 'A token in this policy could not be resolved. Go back and pick it again.'

export type DesiredAllowancesResult =
  | { desired: DesiredAllowance[]; error?: undefined }
  | { desired?: undefined; error: Error }

/** Every row of the form as the builder wants it; decimals come from the option the selector offered. */
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

/** The first of them the Safe already holds, if any — changing that one is the edit flow's job. */
export const findExistingAllowance = (
  desired: readonly DesiredAllowance[],
  existing: readonly SpendingLimitState[],
): DesiredAllowance | undefined =>
  desired.find((allowance) =>
    existing.some((limit) => isSpendingLimitFor(limit, allowance.beneficiary, allowance.tokenAddress)),
  )
