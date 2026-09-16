import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import InfoIcon from '@/public/images/notifications/info.svg'
import type { ReactNode } from 'react'

export function InfoTooltip({
  title,
  'data-testid': dataTestId,
}: {
  title: string | ReactNode
  'data-testid'?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span data-testid={dataTestId}>
            <InfoIcon className="ml-1 inline size-5 align-middle text-[var(--color-border-main)]" />
          </span>
        }
      />
      <TooltipContent side="top">{title}</TooltipContent>
    </Tooltip>
  )
}
