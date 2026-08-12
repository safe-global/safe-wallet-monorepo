import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime, formatTime, formatTimeInWords } from '@safe-global/utils/utils/date'

type DateTimeProps = {
  value: number
  showDateTime: boolean
  showTime: boolean
}

export const DateTime = ({ value, showDateTime, showTime }: DateTimeProps): ReactElement => {
  const showTooltip = !showDateTime || showTime
  const label = (
    <span>{showTime ? formatTime(value) : showDateTime ? formatDateTime(value) : formatTimeInWords(value)}</span>
  )

  if (!showTooltip) {
    return label
  }

  return (
    <Tooltip>
      <TooltipTrigger render={label} />
      <TooltipContent side="top">{formatDateTime(value)}</TooltipContent>
    </Tooltip>
  )
}
