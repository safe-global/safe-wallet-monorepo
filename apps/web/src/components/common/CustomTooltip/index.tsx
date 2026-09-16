import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type CustomTooltipProps = {
  title: ReactNode
  children: ReactElement
  open?: boolean
  onClose?: () => void
  className?: string
}

export const CustomTooltip = ({ title, children, open, onClose, className }: CustomTooltipProps): ReactElement => {
  return (
    <Tooltip open={open} onOpenChange={(value) => !value && onClose?.()}>
      <TooltipTrigger render={<span className="inline-flex" />}>{children}</TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={16}
        className={
          'border border-[var(--color-border-light)] bg-[var(--color-background-paper)] text-base font-bold text-[var(--color-text-primary)]' +
          (className ? ` ${className}` : '')
        }
      >
        {title}
      </TooltipContent>
    </Tooltip>
  )
}
