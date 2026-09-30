import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import type { SpendingLimitState } from '@/features/spending-limits'
import { isSameAllowance } from '@/features/spending-limits/services'
import type { SpendingLimitPolicyFormValues } from '../types'
import { toPolicySummaryModel, type PolicySummarySources } from './toPolicySummaryModel'
import type { LimitSummary, SpenderSummary, SpendingLimitSummaryModel } from './types'

type PreviousLimit = NonNullable<LimitSummary['previous']>

const asPrevious = (limit: SpendingLimitState): PreviousLimit => ({
  amount: safeFormatUnits(limit.amount, limit.token.decimals),
  resetTimeMin: limit.resetTimeMin,
})

/** A limit the form dropped still has to be shown, so it is rebuilt from what the chain holds. */
const toRemovedRow = (limit: SpendingLimitState): LimitSummary => {
  const previous = asPrevious(limit)

  return {
    token: {
      address: limit.token.address,
      symbol: limit.token.symbol,
      decimals: limit.token.decimals ?? undefined,
      logoUri: limit.token.logoUri ?? undefined,
    },
    amount: previous.amount,
    resetTimeMin: previous.resetTimeMin,
    change: 'removed',
    previous,
  }
}

const withSpend = (row: LimitSummary, onChain: SpendingLimitState): LimitSummary =>
  onChain.spent === '0' ? row : { ...row, spent: onChain.spent }

/**
 * Builds the confirm step's model for an edit: every row marked against what the chain holds.
 *
 * @param values - The edited form.
 * @param baseline - The limits the Safe holds, read over RPC.
 * @param sources - Chain and address-book lookups the shared summary model needs.
 * @returns The summary model with each row marked `added` / `changed` / `unchanged` / `removed`,
 *   `previous` set on the two that moved, and `spent` where a changed limit has been drawn on.
 *
 * @remarks
 * An edit describes a change, so rows the form dropped are added back rather than silently
 * disappearing — a removal the signer cannot see is the one thing this screen must not do.
 */
export const toEditSummaryModel = (
  values: SpendingLimitPolicyFormValues,
  baseline: readonly SpendingLimitState[],
  sources: PolicySummarySources,
): SpendingLimitSummaryModel => {
  const base = toPolicySummaryModel(values, sources)

  const kept: SpenderSummary[] = base.spenders.map((spender) => {
    const onChain = baseline.filter((limit) => sameAddress(limit.beneficiary, spender.address))

    const limits = spender.limits.map((row) => {
      const existing = onChain.find((limit) => sameAddress(limit.token.address, row.token.address))
      if (!existing) return { ...row, change: 'added' as const }

      const marked: LimitSummary = {
        ...row,
        change: isSameAllowance({ amount: row.amount, resetTime: row.resetTimeMin }, existing)
          ? 'unchanged'
          : 'changed',
        previous: asPrevious(existing),
      }
      return withSpend(marked, existing)
    })

    const dropped = onChain
      .filter((limit) => !spender.limits.some((row) => sameAddress(row.token.address, limit.token.address)))
      .map(toRemovedRow)

    return {
      ...spender,
      limits: [...limits, ...dropped],
      ...(onChain.length === 0 ? { change: 'added' as const } : {}),
    }
  })

  const goneSpenders = baseline.reduce<SpenderSummary[]>((spenders, limit) => {
    const isKept = base.spenders.some((spender) => sameAddress(spender.address, limit.beneficiary))
    if (isKept) return spenders

    const already = spenders.find((spender) => sameAddress(spender.address, limit.beneficiary))
    if (already) {
      already.limits.push(toRemovedRow(limit))
      return spenders
    }

    const name = Object.entries(sources.names).find(([known]) => sameAddress(known, limit.beneficiary))?.[1]
    return [...spenders, { address: limit.beneficiary, name, limits: [toRemovedRow(limit)], change: 'removed' }]
  }, [])

  return { ...base, spenders: [...kept, ...goneSpenders] }
}
