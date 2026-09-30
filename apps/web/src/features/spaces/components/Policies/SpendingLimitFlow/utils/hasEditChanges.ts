import type { SpendingLimitState } from '@/features/spending-limits'
import type { SpendingLimitPolicyFormValues } from '../types'
import { filledLimits } from './filledLimits'
import { toSpendingLimitFormValues } from './prefill'

/** `100.00` and `100` are one limit: the chain stores base units, not the spelling. */
const normaliseAmount = (amount: string): string =>
  amount.includes('.') ? amount.replace(/0+$/, '').replace(/\.$/, '') : amount

/** Keyed by spender and token, so re-adding a row where it was reads as the same policy. */
const toRows = (values: SpendingLimitPolicyFormValues): Map<string, string> =>
  new Map(
    filledLimits(values).map((row) => [
      `${row.address.toLowerCase()}:${row.tokenAddress.toLowerCase()}`,
      `${normaliseAmount(row.amount)}|${Number(row.resetTime)}`,
    ]),
  )

/**
 * Compared against the form the chain state produces, not the values the form mounted with, which the
 * review step replaces. Only a `false` disables submission: what cannot be settled here goes through.
 */
export const hasEditChanges = (
  baseline: readonly SpendingLimitState[],
  values: SpendingLimitPolicyFormValues,
): boolean => {
  const before = toRows(toSpendingLimitFormValues(values.safe, baseline))
  const after = toRows(values)

  if (before.size !== after.size) return true

  for (const [key, limit] of before) {
    if (after.get(key) !== limit) return true
  }

  return false
}
