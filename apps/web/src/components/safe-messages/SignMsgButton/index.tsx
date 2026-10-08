import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeMessageSignableBy from '@/hooks/messages/useIsSafeMessageSignableBy'
import { TxModalContext } from '@/components/tx-flow'
import { SignMessageFlow } from '@/components/tx-flow/flows'
import CheckWallet from '@/components/common/CheckWallet'
import { SignMsgButtonView } from '@views/components/safe-messages/SignMsgButton/SignMsgButtonView'

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
      {(isOk) => <SignMsgButtonView isOk={isOk} isSignable={isSignable} compact={compact} onClick={onClick} />}
    </CheckWallet>
  )
}

export default SignMsgButton
