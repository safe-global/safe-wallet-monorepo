import type { ReactElement } from 'react'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { validateDecimalLength } from '@safe-global/utils/utils/validation'
import { describeFrequency } from './frequency'
import type { LimitSummary } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/types'
import {
  LimitSummaryRowView,
  type DisplayAmount,
} from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/LimitSummaryRowView'

export { describeSpendReset } from '@views/features/spaces/components/Policies/SpendingLimitFlow/Summary/LimitSummaryRowView'

/**
 * Raw units for `TokenAmount`'s formatter; the typed string is kept when the decimals are unknown or parsing fails.
 * `safeParseUnits` logs every failed parse, and an over-precise amount is expected here, so it is ruled out first.
 */
const toDisplayAmount = (amount: string, decimals?: number): DisplayAmount => {
  if (decimals === undefined || validateDecimalLength(amount, decimals)) return { value: amount }
  const raw = safeParseUnits(amount, decimals)
  return raw === undefined ? { value: amount } : { value: raw.toString(), decimals }
}

type LimitSummaryRowProps = {
  limit: LimitSummary
  /** The Safe's chain: resolves the wording of a non-canonical reset period. */
  chainId: string
}

const LimitSummaryRow = ({ limit, chainId }: LimitSummaryRowProps): ReactElement => {
  const { label } = describeFrequency(limit.resetTimeMin, chainId)
  const previousLabel = limit.previous ? describeFrequency(limit.previous.resetTimeMin, chainId).label : undefined

  return (
    <LimitSummaryRowView
      limit={limit}
      label={label}
      previousLabel={previousLabel}
      amount={toDisplayAmount(limit.amount, limit.token.decimals)}
      previousAmount={
        // Parsed only when shown: a failed parse logs.
        limit.change === 'changed' && limit.previous && limit.previous.amount !== limit.amount
          ? toDisplayAmount(limit.previous.amount, limit.token.decimals)
          : undefined
      }
    />
  )
}

export default LimitSummaryRow
