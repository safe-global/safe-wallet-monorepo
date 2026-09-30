import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import type { SpendingLimitState } from '@/features/spending-limits'
import type { LimitFormValues, SpenderFormValues, SpendingLimitPolicyFormValues } from '../types'

const toLimit = (limit: SpendingLimitState): LimitFormValues => ({
  tokenAddress: limit.token.address,
  amount: safeFormatUnits(limit.amount, limit.token.decimals),
  resetTime: limit.resetTimeMin,
})

/**
 * Turns the limits the chain holds into the values the edit form opens with.
 *
 * @param safe - The form's Safe field: a `"<chainId>:<address>"` key, not a bare address.
 * @param limits - The limits the Safe holds, flat — one entry per spender and token.
 * @returns Form values with one spender card per distinct spender, each carrying that spender's
 *   token rows, amounts formatted for a person to read and periods in minutes.
 *
 * @remarks
 * `safeFormatUnits`, not `formatVisualAmount`: the latter adds thousands separators, which the form
 * would later hand to `parseUnits`.
 */
export const toSpendingLimitFormValues = (
  safe: string,
  limits: readonly SpendingLimitState[],
): SpendingLimitPolicyFormValues => {
  const spenders: SpenderFormValues[] = []

  for (const limit of limits) {
    const card = spenders.find((spender) => sameAddress(spender.address, limit.beneficiary))
    if (card) card.limits.push(toLimit(limit))
    else spenders.push({ address: limit.beneficiary, limits: [toLimit(limit)] })
  }

  return { safe, spenders }
}
