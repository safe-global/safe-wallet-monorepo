import type { ReactElement } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

type NonceTakenButtonProps = {
  /** The row's usual action, "Sign" or "Execute" */
  label: string
  nonce: number
}

/** The action of a transaction whose nonce another one is executing: it can only run if that one fails */
const NonceTakenButton = ({ label, nonce }: NonceTakenButtonProps): ReactElement => (
  <Tooltip delay={150}>
    {/* A disabled button gets no pointer or focus events, so the wrapper holds the tooltip */}
    <TooltipTrigger
      render={
        <span
          tabIndex={0}
          aria-label={`${label}. Available if #${nonce} fails.`}
          data-testid="queue-row-nonce-taken"
          className="flex rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      }
    >
      <Button variant="outline" size="2xs" className="w-20" disabled>
        {label}
      </Button>
    </TooltipTrigger>
    <TooltipContent>Available if #{nonce} fails.</TooltipContent>
  </Tooltip>
)

export default NonceTakenButton
