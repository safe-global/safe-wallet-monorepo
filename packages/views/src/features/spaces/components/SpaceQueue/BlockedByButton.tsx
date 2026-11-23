import type { ReactElement } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'

type BlockedByButtonProps = {
  /** The nonce the row waits on */
  nonce: number
  /** What the user has to do about that nonce */
  hint: string
  onClick: () => void
}

/** A queue row's action while an earlier nonce holds it back: it takes the user to that transaction */
const BlockedByButton = ({ nonce, hint, onClick }: BlockedByButtonProps): ReactElement => (
  <Tooltip delay={150}>
    <TooltipTrigger
      render={
        <Button
          variant="row-hover-primary"
          size="2xs"
          className="min-w-20"
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
        >
          Blocked by #{nonce}
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </Button>
      }
    />
    <TooltipContent>{hint}</TooltipContent>
  </Tooltip>
)

export default BlockedByButton
