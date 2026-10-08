import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ArrowOutwardIcon from '@/public/images/transactions/outgoing.svg'

export type SendTransactionButtonViewProps = {
  canSend: boolean
  onClick: () => void
}

export const SendTransactionButtonView = ({ canSend, onClick }: SendTransactionButtonViewProps): ReactElement => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={!canSend}
        aria-label="Send tokens"
        // eslint-disable-next-line no-restricted-syntax -- filled icon action on space-account row; pending a variant
        className="mx-1 rounded-sm bg-[var(--color-background-main)] [&_svg_path]:fill-foreground disabled:[&_svg_path]:fill-[var(--color-border-main)]"
      >
        <ArrowOutwardIcon />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{canSend ? 'Send tokens' : 'You are not a signer of this Safe account'}</TooltipContent>
  </Tooltip>
)
