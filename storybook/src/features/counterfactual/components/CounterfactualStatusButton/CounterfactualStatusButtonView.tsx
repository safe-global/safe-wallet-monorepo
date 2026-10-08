import InfoIcon from '@/public/images/notifications/info.svg'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { RotateCw } from 'lucide-react'
import type { ComponentProps } from 'react'

export const LoopIcon = ({ className, ...props }: ComponentProps<'svg'>) => {
  return <RotateCw className={cn('animate-spin', className)} {...props} />
}

export type CounterfactualStatusButtonViewProps = {
  isActivating: boolean
}

export const CounterfactualStatusButtonView = ({ isActivating }: CounterfactualStatusButtonViewProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-testid="pending-activation-icon"
            variant="ghost"
            size="icon-sm"
            className={cn(
              // eslint-disable-next-line no-restricted-syntax -- faithful css-module port of .statusButton (radius/padding/bg + layout), pixel-identical; bespoke values have no variant
              'ml-auto [justify-self:flex-end] rounded-[4px] p-[6px] bg-[var(--color-warning-background)]',
              // eslint-disable-next-line no-restricted-syntax -- faithful css-module port of .statusButton.processing (bg override), pixel-identical
              isActivating && 'bg-[var(--color-info-background)]',
              isActivating ? 'text-[var(--color-info-main)]' : 'text-[var(--color-warning-main)]',
            )}
          />
        }
      >
        {isActivating ? <LoopIcon /> : <InfoIcon />}
      </TooltipTrigger>
      <TooltipContent side="right">
        {isActivating ? 'Safe account is being activated' : 'Safe account is not activated'}
      </TooltipContent>
    </Tooltip>
  )
}
