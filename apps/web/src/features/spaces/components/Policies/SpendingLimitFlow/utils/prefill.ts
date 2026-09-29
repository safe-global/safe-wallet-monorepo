import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import type { SpendingLimitState } from '@/features/spending-limits'
import type { LimitFormValues, SpenderFormValues, SpendingLimitPolicyFormValues } from '../types'

const toLimit = (limit: SpendingLimitState): LimitFormValues => ({
  tokenAddress: limit.token.address,
  amount: safeFormatUnits(limit.amount, limit.token.decimals),
  resetTime: limit.resetTimeMin,
})

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
