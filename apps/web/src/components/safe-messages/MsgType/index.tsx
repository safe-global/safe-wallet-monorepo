import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import { MsgTypeView } from '@views/components/safe-messages/MsgType/MsgTypeView'

const MAX_TRIMMED_LENGTH = 20

const getMessageName = (msg: MessageItem) => {
  if (msg.name != null) return msg.name

  if (isEIP712TypedData(msg.message)) {
    return msg.message.domain?.name || ''
  }

  const firstLine = msg.message.split('\n')[0]
  let trimmed = firstLine.slice(0, MAX_TRIMMED_LENGTH)
  if (trimmed.length < firstLine.length) {
    trimmed += '…'
  }
  return trimmed
}

const MsgType = ({ msg }: { msg: MessageItem }) => {
  return <MsgTypeView logoUri={msg.logoUri} name={getMessageName(msg)} />
}

export default MsgType
