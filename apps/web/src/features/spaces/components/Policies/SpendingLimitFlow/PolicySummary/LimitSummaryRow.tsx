import type { ReactElement } from 'react'
import { CalendarClock } from 'lucide-react'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import TokenAmount from '@/components/common/TokenAmount'
import { Typography } from '@/components/ui/typography'
import { describeFrequency } from './frequency'
import type { LimitSummary } from './types'

const TOKEN_ICON_SIZE = 24

type DisplayAmount = { value: string; decimals?: number }

/** Raw units for `TokenAmount`'s formatter; the typed string is kept when the decimals are unknown or parsing fails. */
const toDisplayAmount = ({ amount, token }: LimitSummary): DisplayAmount => {
  if (token.decimals === undefined) return { value: amount }
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="policy-summary-limit">
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
        <Typography variant="paragraph-small" data-testid="policy-summary-frequency">
          {label}
        </Typography>
      </span>
    </div>
  )
}

export default LimitSummaryRow
