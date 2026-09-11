import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

const SelectedCounter = ({
  count,
  limit,
  isAtLimit,
  tooltip,
}: {
  count: number
  /** Null when the plan has no cap on Safe accounts. */
  limit: number | null
  isAtLimit: boolean
  tooltip: string
}) => (
  <Typography
    variant={isAtLimit ? 'paragraph-small-bold' : 'paragraph-small'}
    color={isAtLimit ? 'warning' : 'muted'}
    data-testid="selected-count"
    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap"
  >
    <span>
      {/* Fixed-width, right-aligned digit cell so the row doesn't shift when the count changes width. */}
      <span className="inline-block min-w-[2ch] text-right tabular-nums">{count}</span>
      {limit === null ? ' selected' : ` of ${limit} selected`}
    </span>
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
        <Info className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </Typography>
)

export const safeLimitTooltip = (limit: number | null): string =>
  limit === null
    ? 'Your plan has no limit on Safe accounts per Workspace'
    : `You can add up to ${limit} Safe accounts per Workspace`

export default SelectedCounter
