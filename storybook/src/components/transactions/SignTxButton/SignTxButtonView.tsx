import type { ReactElement, SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'

export type SignTxButtonViewProps = {
  isOk: boolean
  isSignable: boolean
  isSafeOwner: boolean
  isDisabled: boolean
  compact: boolean
  onClick: (e: SyntheticEvent) => void
}

export const SignTxButtonView = ({
  isOk,
  isSignable,
  isSafeOwner,
  isDisabled,
  compact,
  onClick,
}: SignTxButtonViewProps): ReactElement => {
  const button = (
    <span>
      <Track {...TX_LIST_EVENTS.CONFIRM}>
        <Button
          onClick={onClick}
          variant={compact ? 'outline' : 'default'}
          disabled={!isOk || isDisabled}
          // Matches ExecuteTxButton — both sit in the same queue row slot, so a different height
          // here would make Confirm and Execute rows inconsistent.
          size={compact ? 'default' : 'action'}
        >
          Confirm
        </Button>
      </Track>
    </span>
  )

  return isOk && !isSignable && isSafeOwner ? (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>You&apos;ve already signed this transaction</TooltipContent>
    </Tooltip>
  ) : (
    button
  )
}
