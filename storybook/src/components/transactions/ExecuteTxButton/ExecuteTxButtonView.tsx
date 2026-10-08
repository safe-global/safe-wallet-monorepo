import type { ReactElement, SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type ExecuteTxButtonViewProps = {
  isOk: boolean
  isNext: boolean
  isDisabled: boolean
  compact: boolean
  onClick: (e: SyntheticEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export const ExecuteTxButtonView = ({
  isOk,
  isNext,
  isDisabled,
  compact,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ExecuteTxButtonViewProps): ReactElement => {
  const button = (
    <span>
      <Button
        data-testid="execute-tx-btn"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        variant="default"
        disabled={!isOk || isDisabled}
        // `default` rather than `sm` in a queue row: this is the row's primary action, so it gets
        // the app's standard 36px control height instead of the 32px small one.
        size={compact ? 'default' : 'action'}
      >
        Execute
      </Button>
    </span>
  )

  return isOk && !isNext ? (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>You must execute the transaction with the lowest nonce first</TooltipContent>
    </Tooltip>
  ) : (
    button
  )
}
