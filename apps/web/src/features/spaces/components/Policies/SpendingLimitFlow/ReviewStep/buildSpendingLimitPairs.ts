import type { SpendingLimitPair, SpendingLimitState } from '@/features/spending-limits'
import { isSpendingLimitFor } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { findTokenOption, type TokenOption } from '../utils/tokenOptions'

export const UNKNOWN_TOKEN_IN_POLICY_ERROR = 'A token in this policy could not be resolved. Go back and pick it again.'

export type SpendingLimitPairsResult =
  | { pairs: SpendingLimitPair[]; error?: undefined }
  | { pairs?: undefined; error: Error }

/** Every row of the form as the builder wants it; decimals come from the option the selector offered. */
export const buildSpendingLimitPairs = (
  values: SpendingLimitPolicyFormValues,
  tokens: readonly TokenOption[],
): SpendingLimitPairsResult => {
  const pairs: SpendingLimitPair[] = []

  for (const spender of values.spenders) {
    for (const limit of spender.limits) {
      const token = findTokenOption(tokens, limit.tokenAddress)
      if (!token) return { error: new Error(UNKNOWN_TOKEN_IN_POLICY_ERROR) }

      pairs.push({
        beneficiary: spender.address,
        tokenAddress: limit.tokenAddress,
        amount: limit.amount,
        decimals: token.decimals,
        resetTime: limit.resetTime,
      })
    }
  }

  return { pairs }
}

/** The first pair the selected Safe already limits, if any — changing it is the edit flow's job. */
export const findExistingPair = (
  pairs: readonly SpendingLimitPair[],
  existing: readonly SpendingLimitState[],
): SpendingLimitPair | undefined =>
  pairs.find((pair) => existing.some((limit) => isSpendingLimitFor(limit, pair.beneficiary, pair.tokenAddress)))
