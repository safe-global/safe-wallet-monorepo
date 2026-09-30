import type { SpendingLimitState } from '@/features/spending-limits'
import { isSameAllowance, isSpendingLimitFor } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { filledLimits, type FilledLimit } from './filledLimits'

/** @returns `true` when the row matches the chain; a half-typed amount cannot, so it counts as changed. */
const matchesChain = (row: FilledLimit, onChain: SpendingLimitState): boolean => {
  try {
    return isSameAllowance({ amount: row.amount, resetTime: row.resetTime }, onChain)
  } catch {
    return false
  }
}

/**
 * Tells whether an edit has changed anything the chain does not already hold.
 *
 * @param baseline - The limits the Safe holds, read over RPC.
 * @param values - The form as it stands.
 * @returns `false` only when every complete row matches the chain and nothing was added or dropped.
 *
 * @remarks
 * Judged against the chain, never against the values the form mounted with, which the review step
 * replaces. Only a proven `false` disables submission, and {@link isSameAllowance} is the same rule
 * the transaction is built from, so `Next` opens exactly when there is something to sign.
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
