import type { SpendingLimitState } from '@/features/spending-limits'
import type { SpendingLimitPolicyFormValues } from '../types'
import { toSpendingLimitFormValues } from './prefill'

/** `100.00` and `100` are one limit: the chain stores base units, not the spelling. */
const normaliseAmount = (amount: string): string =>
  amount.includes('.') ? amount.replace(/0+$/, '').replace(/\.$/, '') : amount

/** Keyed by spender and token, so re-adding a row where it was reads as the same policy. */
const toRows = (values: SpendingLimitPolicyFormValues): Map<string, string> => {
  const rows = new Map<string, string>()

  for (const spender of values.spenders) {
    if (!spender.address) continue

    for (const limit of spender.limits) {
      if (!limit.tokenAddress) continue

      rows.set(
        `${spender.address.toLowerCase()}:${limit.tokenAddress.toLowerCase()}`,
        `${normaliseAmount(limit.amount)}|${Number(limit.resetTime)}`,
      )
    }
  }

  return rows
}

/**
 * Whether the form still describes what the chain holds. Compared against the form the chain state
 * produces rather than against the values the form mounted with, which a trip to the review step
 * replaces. Only an answer of `false` is trusted to disable submission: an edit that cannot be proven
 * to change nothing goes through, and the review step says what it would do.
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
