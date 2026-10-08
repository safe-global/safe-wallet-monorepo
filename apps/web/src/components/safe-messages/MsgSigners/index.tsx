import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { type ReactElement } from 'react'
import EthHashInfo from '@/components/common/EthHashInfo'
import { MsgSignersView } from '@views/components/safe-messages/MsgSigners/MsgSignersView'

const MsgSigners = ({
  msg,
  showOnlyConfirmations = false,
  showMissingSignatures = false,
  backgroundColor,
}: {
  msg: MessageItem
  showOnlyConfirmations?: boolean
  showMissingSignatures?: boolean
  backgroundColor?: string
}): ReactElement => {
  return (
    <MsgSignersView
      msg={msg}
      showOnlyConfirmations={showOnlyConfirmations}
      showMissingSignatures={showMissingSignatures}
      backgroundColor={backgroundColor}
      renderSigner={({ address, name }) => <EthHashInfo address={address} name={name} hasExplorer showCopyButton />}
    />
  )
}

export default MsgSigners
