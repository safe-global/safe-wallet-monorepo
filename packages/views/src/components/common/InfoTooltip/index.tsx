import { Tooltip, TooltipTrigger, TooltipContent } from '@safe-global/views/components/ui/tooltip'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import type { ReactNode } from 'react'
import { cn } from '@safe-global/views/utils/cn'

export function InfoTooltip({
  title,
  className,
  'data-testid': dataTestId,
}: {
  title: string | ReactNode
  className?: string
  'data-testid'?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span data-testid={dataTestId}>
            <InfoIcon className={cn('ml-1 inline size-5 align-middle text-[var(--color-border-main)]', className)} />
          </span>
        }
      />
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  )
}
