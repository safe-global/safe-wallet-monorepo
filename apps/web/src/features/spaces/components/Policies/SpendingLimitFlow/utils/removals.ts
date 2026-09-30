import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SpendingLimitState } from '@/features/spending-limits'
import { isSpendingLimitFor } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { filledLimits } from './filledLimits'

/** What an edit would take away, counted for the notice that stands in for the removed rows. */
export type PendingRemovals = {
  /** On-chain spenders the form no longer carries at all. */
  spenders: string[]
  /** On-chain (spender, token) limits the form no longer carries. */
  limits: number
}

/**
 * Works out what the form has dropped since it opened.
 *
 * @param baseline - The limits the Safe holds, read over RPC.
 * @param values - The form as it stands, half-typed rows included.
 * @returns The spenders that would lose every limit, and how many limits would go in total.
 */
export const findPendingRemovals = (
  baseline: readonly SpendingLimitState[],
  values: SpendingLimitPolicyFormValues,
): PendingRemovals => {
  const kept = filledLimits(values)
  const gone = baseline.filter((limit) => !kept.some((row) => isSpendingLimitFor(limit, row.address, row.tokenAddress)))

  const keptSpenders = values.spenders.map((spender) => spender.address).filter(Boolean)
  const spenders = gone.reduce<string[]>((unique, limit) => {
    const isKept = keptSpenders.some((address) => sameAddress(address, limit.beneficiary))
    const isSeen = unique.some((address) => sameAddress(address, limit.beneficiary))
    return isKept || isSeen ? unique : [...unique, limit.beneficiary]
  }, [])

  return { spenders, limits: gone.length }
}

/** The notice's two lines: what goes, and what that means before the transaction executes. */
export type RemovalCopy = { title: string; description: string }

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

const STAYS_IN_FORCE = 'They can still be spent until this transaction is executed.'
const POLICY_GOES = 'Executing it removes the spending limit from this Safe account entirely.'

/**
 * Puts what would be removed into words.
 *
 * @param removals - The counts from {@link findPendingRemovals}.
 * @param isEmptyPolicy - Whether the form has no spender left, which removes the policy itself and
 *   so earns a second sentence.
 * @returns The notice's title and description.
 */
export const describeRemovals = (removals: PendingRemovals, isEmptyPolicy: boolean): RemovalCopy => {
  const limits = plural(removals.limits, 'limit')
  const title =
    removals.spenders.length > 0
      ? `${plural(removals.spenders.length, 'spender')} and ${limits} will be removed`
      : `${limits} will be removed`

  return { title, description: isEmptyPolicy ? `${STAYS_IN_FORCE} ${POLICY_GOES}` : STAYS_IN_FORCE }
}
