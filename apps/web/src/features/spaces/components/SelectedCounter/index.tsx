import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

const SelectedCounter = ({
  count,
  limit,
  isAtLimit,
  tooltip,
  showSelected = true,
}: {
  count: number
  /** Null when the plan has no cap on Safe accounts. */
  limit: number | null
  isAtLimit: boolean
  tooltip: string
  /** Off for a plain usage readout ("3 of 20") rather than a selection ("3 of 20 selected"). */
  showSelected?: boolean
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
      {limit === null ? '' : ` of ${limit}`}
      {showSelected && ' selected'}
    </span>
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-help" />}>
        <Info className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  </Typography>
)

export default SelectedCounter
