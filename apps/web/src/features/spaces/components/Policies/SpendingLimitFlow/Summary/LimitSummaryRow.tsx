import type { ReactElement } from 'react'
import { CalendarClock } from 'lucide-react'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import TokenAmount from '@/components/common/TokenAmount'
import { Typography } from '@/components/ui/typography'
import { describeFrequency } from './frequency'
import type { LimitSummary } from './types'

const TOKEN_ICON_SIZE = 24

type DisplayAmount = { value: string; decimals?: number }

/**
 * An amount carrying more precision than the token holds is an ordinary outcome here — an edit path or a stale
 * model can produce one — and `safeParseUnits` logs every failed parse. Checking first keeps that expected case out
 * of the console, and leaves the log for a genuinely malformed amount, which is a fault worth seeing.
 */
const exceedsPrecision = (amount: string, decimals: number): boolean => (amount.split('.')[1]?.length ?? 0) > decimals

/** Raw units for `TokenAmount`'s formatter; the typed string is kept when the decimals are unknown or parsing fails. */
const toDisplayAmount = ({ amount, token }: LimitSummary): DisplayAmount => {
  if (token.decimals === undefined || exceedsPrecision(amount, token.decimals)) return { value: amount }
  const raw = safeParseUnits(amount, token.decimals)
  return raw === undefined ? { value: amount } : { value: raw.toString(), decimals: token.decimals }
}

type LimitSummaryRowProps = {
  limit: LimitSummary
  /** The Safe's chain: resolves the wording of a non-canonical reset period. */
  chainId: string
}

/** One limit: token icon, amount and symbol, then that row's own frequency. */
const LimitSummaryRow = ({ limit, chainId }: LimitSummaryRowProps): ReactElement => {
  const { value, decimals } = toDisplayAmount(limit)
  const { label } = describeFrequency(limit.resetTimeMin, chainId)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="spending-limit-summary-limit">
      <TokenAmount
        value={value}
        decimals={decimals}
        logoUri={limit.token.logoUri}
        tokenSymbol={limit.token.symbol}
        iconSize={TOKEN_ICON_SIZE}
      />

      <span className="flex items-center gap-2">
        <span
          className="bg-muted-foreground/10 text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full"
          aria-hidden
        >
          <CalendarClock className="size-4" />
        </span>
        <Typography variant="paragraph-small" data-testid="spending-limit-summary-frequency">
          {label}
        </Typography>
      </span>
    </div>
  )
}

export default LimitSummaryRow
