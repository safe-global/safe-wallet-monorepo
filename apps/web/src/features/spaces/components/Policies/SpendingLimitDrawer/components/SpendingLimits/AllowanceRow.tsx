import type { ReactElement } from 'react'
import TokenIcon from '@/components/common/TokenIcon'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import type { PolicyAllowance } from '../../../types'
import { formatAllowanceAmount, formatRemaining, formatResetUtc, remainingPercent } from '../../format'

const TOKEN_ICON_SIZE = 24

export type AllowanceRowProps = {
  allowance: PolicyAllowance
  showUsage: boolean
}

const AllowanceRow = ({ allowance, showUsage }: AllowanceRowProps): ReactElement => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2">
        <TokenIcon
          logoUri={allowance.token.logoUri ?? undefined}
          tokenSymbol={allowance.token.symbol}
          size={TOKEN_ICON_SIZE}
        />
        <Typography variant="paragraph-small" className="truncate">
          {allowance.token.symbol}
        </Typography>
      </span>

      <Typography variant="paragraph-small-medium" className="shrink-0">
        {formatAllowanceAmount(allowance)}
      </Typography>
    </div>

    {showUsage && (
      <>
        {/* Track and fill match the preview in SpendingLimitIntroDialog; the default track is the card's own colour. */}
        <Progress
          value={remainingPercent(allowance)}
          aria-label={`${allowance.token.symbol}: ${formatRemaining(allowance)}`}
        >
          <ProgressTrack className="bg-border">
            <ProgressIndicator className="bg-badge-dot-success" />
          </ProgressTrack>
        </Progress>

        <div className="flex items-center justify-between gap-2">
          <Typography variant="paragraph-mini" color="muted">
            {formatRemaining(allowance)}
          </Typography>

          {allowance.resetsAtMinute !== null && (
            <Typography variant="paragraph-mini" color="muted" className="shrink-0">
              Resets {formatResetUtc(allowance.resetsAtMinute)}
            </Typography>
          )}
        </div>
      </>
    )}
  </div>
)

export default AllowanceRow
