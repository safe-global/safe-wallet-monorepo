import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Kbd } from '@safe-global/views/components/ui/kbd'

export function StepButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  const previous = direction === 'previous'
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <Button
            variant="surface"
            size="icon"
            aria-label={previous ? 'Previous transaction' : 'Next transaction'}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {previous ? <ChevronUp /> : <ChevronDown />}
      </TooltipTrigger>
      <TooltipContent>
        {previous ? 'Previous' : 'Next'} <Kbd>{previous ? 'K' : 'J'}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}
