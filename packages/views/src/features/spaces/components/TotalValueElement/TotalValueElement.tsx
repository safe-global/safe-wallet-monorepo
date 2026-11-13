import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'
import { FitText } from '@safe-global/views/components/common/FitText'

const MAX_FONT_SIZE = 30
const MIN_FONT_SIZE = 18

/**
 * TotalValueElement
 *
 * Presentational component displaying a "Total value" label with a formatted monetary amount.
 * Part of Spaces feature design.
 * Figma: https://www.figma.com/design/5z9yzEgPAhCMGIumIwvXQY/Enterprise-workspace?node-id=7506-30004
 */

interface TotalValueElementProps {
  value: string
  loading?: boolean
}

const TotalValueElement = ({ value, loading }: TotalValueElementProps) => {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Typography variant="paragraph-mini-medium" color="muted">
        Total value
      </Typography>
      {loading ? (
        <Skeleton className="h-[30px] w-48" />
      ) : (
        <Typography
          variant="h2"
          className="font-bold leading-[1] tracking-tight"
          data-testid="space-dashboard-total-value"
        >
          <FitText maxFontSize={MAX_FONT_SIZE} minFontSize={MIN_FONT_SIZE}>
            {value}
          </FitText>
        </Typography>
      )}
    </div>
  )
}

export { TotalValueElement }
