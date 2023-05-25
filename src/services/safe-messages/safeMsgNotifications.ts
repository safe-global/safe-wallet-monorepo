import { getSafeMessage, SafeMessageListItemType, type SafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import { logError, Errors } from '../exceptions'
import { asError } from '../exceptions/utils'
import { safeMsgDispatch, SafeMsgEvent } from './safeMsgEvents'

const isMessageFullySigned = (message: SafeMessage): message is SafeMessage & { preparedSignature: string } => {
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
  chainId: string,
  safeMessageHash: string,
  onClose: () => void,
  requestId?: string,
) => {
  let message: SafeMessage | undefined
  try {
    const fetchedMessage = await getSafeMessage(chainId, safeMessageHash)

    // fetchedMessage does not have a type because it is explicitly a message
    message = { ...fetchedMessage, type: SafeMessageListItemType.MESSAGE }
  } catch (err) {
    const error = asError(err)

    logError(Errors._613, error.message)
    throw error
  }

  if (isMessageFullySigned(message)) {
    safeMsgDispatch(SafeMsgEvent.SIGNATURE_PREPARED, {
      messageHash: safeMessageHash,
      requestId,
      signature: message.preparedSignature,
    })
    onClose()
  }
}
