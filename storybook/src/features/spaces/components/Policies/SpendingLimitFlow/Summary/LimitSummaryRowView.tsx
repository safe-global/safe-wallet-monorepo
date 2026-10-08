import type { ReactElement } from 'react'
import { CalendarClock } from 'lucide-react'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import TokenAmount from '@/components/common/TokenAmount'
import TokenIcon from '@/components/common/TokenIcon'
import { Badge } from '@/components/ui/badge'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { CHANGE_BADGE } from './constants'
import type { LimitSummary } from './types'

const TOKEN_ICON_SIZE = 24

/** Fixed columns so rows line up; the frequency one fits the longest label rather than truncating it. */
const COLUMNS = 'grid grid-cols-[24px_minmax(0,1fr)_7.75rem] items-center gap-x-3 gap-y-1'
const COLUMNS_WITH_VERDICT = 'grid grid-cols-[24px_minmax(0,1fr)_7.75rem_6rem] items-center gap-x-3 gap-y-1'

export type DisplayAmount = { value: string; decimals?: number }

/** `setAllowance` keeps no spend, so any change to a partly used limit hands the whole new amount back at once. */
export const describeSpendReset = (limit: LimitSummary): string | undefined => {
  if (limit.change !== 'changed' || !limit.spent) return undefined

  const spent = safeFormatUnits(limit.spent, limit.token.decimals)
  return `The ${spent} ${limit.token.symbol} already spent this period is reset: the full ${limit.amount} ${limit.token.symbol} becomes available as soon as this executes.`
}

export type LimitSummaryRowViewProps = {
  limit: LimitSummary
  /** Frequency label of the limit. */
  label: string
  /** Frequency label of the limit before the edit, if any. */
  previousLabel?: string
  amount: DisplayAmount
  previousAmount?: DisplayAmount
}

/** The token is named once, in the icon column, so the amounts themselves stay plain text. */
const Amount = ({
  amount,
  limit,
  struck,
}: {
  amount: DisplayAmount
  limit: LimitSummary
  struck?: boolean
}): ReactElement => (
  // `TokenAmount` puts the figure in a nested `<b>`, which does not inherit the strike.
  <span className={struck ? 'text-muted-foreground [&_b]:line-through' : undefined}>
    <TokenAmount value={amount.value} decimals={amount.decimals} tokenSymbol={limit.token.symbol} />
  </span>
)

export const LimitSummaryRowView = ({
  limit,
  label,
  previousLabel,
  amount,
  previousAmount,
}: LimitSummaryRowViewProps): ReactElement => {
  const isRemoved = limit.change === 'removed'
  const isChanged = limit.change === 'changed'
  // Only the half that moved shows both of its values.
  const showsPreviousAmount = isChanged && limit.previous !== undefined && limit.previous.amount !== limit.amount
  const showsPreviousLabel = isChanged && previousLabel !== undefined && previousLabel !== label
  const badge = limit.change ? CHANGE_BADGE[limit.change] : undefined
  const spendReset = describeSpendReset(limit)

  return (
    <div className="flex flex-col gap-1" data-testid="spending-limit-summary-limit">
      <div className={badge ? COLUMNS_WITH_VERDICT : COLUMNS}>
        <span className={isRemoved ? 'opacity-50' : undefined}>
          <TokenIcon logoUri={limit.token.logoUri} tokenSymbol={limit.token.symbol} size={TOKEN_ICON_SIZE} noRadius />
        </span>

        {/* Stacked: at this width an arrow between the two values wraps and reads as a typo. */}
        <span className="flex min-w-0 flex-col overflow-hidden">
          {showsPreviousAmount && limit.previous && previousAmount && (
            <Amount amount={previousAmount} limit={limit} struck />
          )}
          <Amount amount={amount} limit={limit} struck={isRemoved} />
        </span>

        <span className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span
            className="bg-muted-foreground/10 text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full"
            aria-hidden
          >
            <CalendarClock className="size-4" />
          </span>
          {/* Stacked like the amounts: two periods do not fit beside them on one line. */}
          <span className="flex min-w-0 flex-col" data-testid="spending-limit-summary-frequency">
            {showsPreviousLabel && (
              <Typography variant="paragraph-small" className="truncate text-muted-foreground line-through">
                {previousLabel}
              </Typography>
            )}
            <Typography
              variant="paragraph-small"
              className={cn('truncate', isRemoved && 'text-muted-foreground line-through')}
            >
              {label}
            </Typography>
          </span>
        </span>

        {badge && (
          <Badge variant={badge.variant} className="w-full justify-center" data-testid={`limit-change-${limit.change}`}>
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
