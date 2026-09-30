import type { SpendingLimitState } from '@/features/spending-limits'
import { isSameAllowance, isSpendingLimitFor } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { filledLimits, type FilledLimit } from './filledLimits'

/**
 * The same rule the transaction is built from, so `Next` opens exactly when there is something to sign.
 * A half-typed amount cannot be parsed into base units, and an unproven match is not a match.
 */
const matchesChain = (row: FilledLimit, onChain: SpendingLimitState): boolean => {
  try {
    return isSameAllowance({ amount: row.amount, resetTime: row.resetTime }, onChain)
  } catch {
    return false
  }
}

/**
 * Compared against the chain, never against the values the form mounted with, which the review step
 * replaces. Only a proven `false` disables submission: what cannot be settled here goes through.
 */
export const hasEditChanges = (
  baseline: readonly SpendingLimitState[],
  values: SpendingLimitPolicyFormValues,
): boolean => {
  const rows = filledLimits(values)
  if (rows.length !== baseline.length) return true

  // Equal counts and every row matching one of them leaves nothing unaccounted for on either side.
  return rows.some((row) => {
    const onChain = baseline.find((limit) => isSpendingLimitFor(limit, row.address, row.tokenAddress))
    return onChain === undefined || !matchesChain(row, onChain)
  })
}
