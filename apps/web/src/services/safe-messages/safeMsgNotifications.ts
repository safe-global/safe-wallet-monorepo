import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { safeMsgDispatch, SafeMsgEvent } from './safeMsgEvents'

const isMessageFullySigned = (message: MessageItem): message is MessageItem & { preparedSignature: string } => {
  return message.confirmationsSubmitted >= message.confirmationsRequired && !!message.preparedSignature
}

/**
 * Dispatches a notification including the `preparedSignature` of the message if it is fully signed.
 *
 * @param chainId
 * @param safeMessageHash
 * @param onClose
 * @param requestId
 */
export const dispatchPreparedSignature = async (
  message: MessageItem,
  safeMessageHash: string,
  onClose: () => void,
  requestId?: string,
) => {
  if (isMessageFullySigned(message)) {
    safeMsgDispatch(SafeMsgEvent.SIGNATURE_PREPARED, {
      messageHash: safeMessageHash,
      requestId,
      signature: message.preparedSignature,
    })
    onClose()
  }
}
