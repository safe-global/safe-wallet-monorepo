import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SyntheticEvent, ReactElement } from 'react'

import Track from '@/components/common/Track'
import { MESSAGE_EVENTS } from '@/services/analytics/events/txList'

export type SignMsgButtonViewProps = {
  isOk: boolean
  isSignable: boolean
  compact: boolean
  onClick: (e: SyntheticEvent) => void
}

export const SignMsgButtonView = ({ isOk, isSignable, compact, onClick }: SignMsgButtonViewProps): ReactElement => {
  const button = (
    <span>
      <Track {...MESSAGE_EVENTS.SIGN}>
        <Button
          onClick={onClick}
          variant={isSignable ? 'default' : 'outline'}
          disabled={!isOk || !isSignable}
          size={compact ? 'sm' : 'action'}
        >
          Sign
        </Button>
      </Track>
    </span>
  )

  return isOk && !isSignable ? (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>You&apos;ve already signed this message</TooltipContent>
    </Tooltip>
  ) : (
    button
  )
}
