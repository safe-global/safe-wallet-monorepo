import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { getAllowanceUsage } from '../../utils/policyUsage'
import type { PolicyAllowance } from '../../types'

/** For one allowance: how far through the period it is, how much is left, and when it resets. */
const AllowanceUsage = ({ allowance }: { allowance: PolicyAllowance }) => {
  const { percentUsed, remainingLabel, resetLabel, isExhausted } = getAllowanceUsage(allowance)

  return (
    <div className="flex flex-col gap-1" data-testid="allowance-usage">
      <Progress value={percentUsed} aria-label={remainingLabel}>
        <ProgressTrack className="h-1">
          <ProgressIndicator className={cn(isExhausted ? 'bg-destructive' : 'bg-accent-success')} />
        </ProgressTrack>
      </Progress>

      <div className="flex items-center justify-between gap-3">
        <Typography
          variant="paragraph-small"
          className={cn(isExhausted ? 'text-destructive' : 'text-muted-foreground')}
          data-testid="allowance-remaining"
        >
          {remainingLabel}
        </Typography>

        {resetLabel && (
          <Typography variant="paragraph-small" className="shrink-0 text-muted-foreground">
            {resetLabel}
          </Typography>
        )}
      </div>
    </div>
  )
}

export default AllowanceUsage
