import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { formatDateTime, formatShortTimeAgo } from '@safe-global/utils/utils/date'
import { QUEUE_TOOLTIP_DELAY } from './tooltip'

/** Short proposed time ("5h ago"), with the full date and time in the tooltip */
const QueueProposedTime = ({ timestamp }: { timestamp: number }): ReactElement => (
  <Tooltip delay={QUEUE_TOOLTIP_DELAY}>
    <TooltipTrigger className="truncate">{formatShortTimeAgo(timestamp)}</TooltipTrigger>
    <TooltipContent>{formatDateTime(timestamp)}</TooltipContent>
  </Tooltip>
)

export default QueueProposedTime
