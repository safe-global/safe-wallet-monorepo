import type { ReactElement } from 'react'
import { CalendarClock } from 'lucide-react'
import { safeFormatUnits, safeParseUnits } from '@safe-global/utils/utils/formatters'
import { validateDecimalLength } from '@safe-global/utils/utils/validation'
import TokenAmount from '@/components/common/TokenAmount'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { describeFrequency } from './frequency'
import { CHANGE_BADGE } from './constants'
import type { LimitChange, LimitSummary } from './types'

const TOKEN_ICON_SIZE = 24

type DisplayAmount = { value: string; decimals?: number }

/**
 * Raw units for `TokenAmount`'s formatter; the typed string is kept when the decimals are unknown or parsing fails.
 * `safeParseUnits` logs every failed parse, and an over-precise amount is expected here, so it is ruled out first.
 */
const toDisplayAmount = (amount: string, decimals?: number): DisplayAmount => {
  if (decimals === undefined || validateDecimalLength(amount, decimals)) return { value: amount }
  const raw = safeParseUnits(amount, decimals)
  return raw === undefined ? { value: amount } : { value: raw.toString(), decimals }
}

/** `setAllowance` keeps no spend, so any change to a partly used limit hands the whole new amount back at once. */
export const describeSpendReset = (limit: LimitSummary): string | undefined => {
  if (limit.change !== 'changed' || !limit.spent) return undefined

  const spent = safeFormatUnits(limit.spent, limit.token.decimals)
  return `The ${spent} ${limit.token.symbol} already spent this period is reset: the full ${limit.amount} ${limit.token.symbol} becomes available as soon as this executes.`
}

type LimitSummaryRowProps = {
  limit: LimitSummary
  /** The Safe's chain: resolves the wording of a non-canonical reset period. */
  chainId: string
}

const Amount = ({
  amount,
  decimals,
  limit,
  muted,
}: {
  amount: string
  decimals?: number
  limit: LimitSummary
  muted?: boolean
}): ReactElement => {
  const display = toDisplayAmount(amount, decimals)

  return (
    <span className={muted ? 'text-muted-foreground line-through' : undefined}>
      <TokenAmount
        value={display.value}
        decimals={display.decimals}
        logoUri={muted ? undefined : limit.token.logoUri}
        tokenSymbol={limit.token.symbol}
        iconSize={TOKEN_ICON_SIZE}
      />
    </span>
  )
}

const LimitSummaryRow = ({ limit, chainId }: LimitSummaryRowProps): ReactElement => {
  const { label } = describeFrequency(limit.resetTimeMin, chainId)
  const previousLabel = limit.previous ? describeFrequency(limit.previous.resetTimeMin, chainId).label : undefined
  const isRemoved = limit.change === 'removed'
  const showsBothSides = limit.change === 'changed' && limit.previous !== undefined
  const badge = limit.change ? CHANGE_BADGE[limit.change as LimitChange] : undefined
  const spendReset = describeSpendReset(limit)

  return (
    <div className="flex flex-col gap-1" data-testid="spending-limit-summary-limit">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {showsBothSides && limit.previous && (
          <>
            <Amount amount={limit.previous.amount} decimals={limit.token.decimals} limit={limit} muted />
            <span aria-hidden className="text-muted-foreground">
              →
            </span>
          </>
        )}

        <Amount amount={limit.amount} decimals={limit.token.decimals} limit={limit} muted={isRemoved} />

        <span className="flex items-center gap-2">
          <span
            className="bg-muted-foreground/10 text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full"
            aria-hidden
          >
            <CalendarClock className="size-4" />
          </span>
          <Typography
            variant="paragraph-small"
            className={isRemoved ? 'text-muted-foreground line-through' : undefined}
            data-testid="spending-limit-summary-frequency"
          >
            {showsBothSides && previousLabel && previousLabel !== label ? `${previousLabel} → ${label}` : label}
          </Typography>
        </span>

        {badge && (
          <Badge variant={badge.variant} className="ml-auto" data-testid={`limit-change-${limit.change}`}>
            {badge.label}
          </Badge>
        )}
      </div>

      {spendReset && (
        <Typography variant="paragraph-mini" color="muted" data-testid="spend-reset-warning">
          {spendReset}
        </Typography>
      )}
    </div>
  )
}

export default LimitSummaryRow
