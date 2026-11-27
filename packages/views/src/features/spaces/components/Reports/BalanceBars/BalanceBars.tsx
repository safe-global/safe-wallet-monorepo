import type { ReactElement } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'

import type { ReportBar } from '../types'

export const BalanceBars = ({
  bars,
  onSelect,
}: {
  bars: ReportBar[]
  onSelect: (id: string) => void
}): ReactElement => (
  <div className="flex h-28 w-full items-stretch sm:w-[440px]" role="group" aria-label="Total balance by month">
    {bars.map((bar) => (
      <Tooltip key={bar.id}>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="group/bar flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end"
              aria-label={`${bar.tooltipTitle}: ${bar.value}`}
              onClick={() => onSelect(bar.id)}
            />
          }
        >
          <span
            className={cn(
              'w-3/5 max-w-14 rounded-t-sm transition-colors',
              bar.isCurrent ? 'bg-foreground' : 'bg-foreground/20 group-hover/bar:bg-foreground/40',
            )}
            style={{ height: `${bar.heightPercent}%` }}
          />
          <Typography
            variant={bar.isCurrent ? 'paragraph-mini-bold' : 'paragraph-mini'}
            color={bar.isCurrent ? 'default' : 'muted'}
            className="w-full border-t pt-1.5 text-center"
          >
            {bar.label}
          </Typography>
        </TooltipTrigger>
        <TooltipContent>
          {bar.tooltipTitle}
          <br />
          <strong>{bar.value}</strong>
        </TooltipContent>
      </Tooltip>
    ))}
  </div>
)
