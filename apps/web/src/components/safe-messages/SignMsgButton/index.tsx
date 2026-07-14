import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import useWallet from '@/hooks/wallets/useWallet'
import Track from '@/components/common/Track'
import { MESSAGE_EVENTS } from '@/services/analytics/events/txList'
import useIsSafeMessageSignableBy from '@/hooks/messages/useIsSafeMessageSignableBy'
import { TxModalContext } from '@/components/tx-flow'
import { SignMessageFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'

const SignMsgButton = ({ msg, compact = false }: { msg: MessageItem; compact?: boolean }): ReactElement => {
  const wallet = useWallet()
  const isSignable = useIsSafeMessageSignableBy(msg, wallet?.address || '')
  const { setTxFlow } = useContext(TxModalContext)

  const onClick = (e: SyntheticEvent) => {
    e.stopPropagation()
    setTxFlow(<SignMessageFlow {...msg} origin={msg.origin || undefined} />)
  }

  return (
    <CheckWallet>
      {(isOk) => {
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
      }}
    </CheckWallet>
  )
}

export default SignMsgButton
