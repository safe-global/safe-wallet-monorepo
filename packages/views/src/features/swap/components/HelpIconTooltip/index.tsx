import { Tooltip, TooltipTrigger, TooltipContent } from '@safe-global/views/components/ui/tooltip'
import InfoIcon from '@safe-global/views/assets/images/notifications/info.svg'
import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
}
export const HelpIconTooltip = ({ title }: Props) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span>
            <InfoIcon className="ml-1 inline size-5 align-middle text-[var(--color-border-main)]" />
          </span>
        }
      />
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}
