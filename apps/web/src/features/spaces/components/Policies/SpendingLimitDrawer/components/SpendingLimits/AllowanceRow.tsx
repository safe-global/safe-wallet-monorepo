import type { ReactElement } from 'react'
import TokenIcon from '@/components/common/TokenIcon'
import { Badge } from '@/components/ui/badge'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { CHANGE_BADGE } from '../../../SpendingLimitFlow/Summary/constants'
import type { PolicyAllowance } from '../../../types'
import { formatAllowanceAmount, formatRemaining, formatResetUtc, remainingPercent } from '../../format'

const TOKEN_ICON_SIZE = 24

export type AllowanceRowProps = {
  allowance: PolicyAllowance
  showUsage: boolean
}

const AllowanceRow = ({ allowance, showUsage }: AllowanceRowProps): ReactElement => {
  const badge = allowance.change ? CHANGE_BADGE[allowance.change] : undefined
  const isRemoved = allowance.change === 'removed'
  const struck = isRemoved ? 'text-muted-foreground line-through' : undefined

  return (
    <div className="flex flex-col gap-1.5" data-testid="spending-limit-allowance">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className={isRemoved ? 'opacity-50' : undefined}>
            <TokenIcon
              logoUri={allowance.token.logoUri ?? undefined}
              tokenSymbol={allowance.token.symbol}
              size={TOKEN_ICON_SIZE}
            />
          </span>
          <Typography variant="paragraph-small" className={cn('truncate', struck)}>
            {allowance.token.symbol}
          </Typography>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <Typography variant="paragraph-small-medium" className={struck}>
            {formatAllowanceAmount(allowance)}
          </Typography>
          {badge && (
            <Badge
              variant={badge.variant}
              className="w-20 justify-center"
              data-testid={`allowance-change-${allowance.change}`}
            >
              {badge.label}
            </Badge>
          )}
        </span>
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
}

export default AllowanceRow
