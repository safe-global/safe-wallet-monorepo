import type { TypedData, MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import useWallet from '@/hooks/wallets/useWallet'
import { Errors, logError } from '@/services/exceptions'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { dispatchPreparedSignature } from '@/services/safe-messages/safeMsgNotifications'
import { dispatchSafeMsgProposal, dispatchSafeMsgConfirmation } from '@/services/safe-messages/safeMsgSender'
import { getSafeMessage } from '@safe-global/safe-gateway-typescript-sdk'
import { useEffect, useCallback, useState } from 'react'
import useSafeInfo from '../useSafeInfo'

const HIDE_DELAY = 3000

export const fetchSafeMessage = async (safeMessageHash: string, chainId: string): Promise<MessageItem | undefined> => {
  let message: MessageItem | undefined
  try {
    // fetchedMessage does not have a type because it is explicitly a message
    const fetchedMessage = await getSafeMessage(chainId, safeMessageHash)
    // @ts-expect-error - the getSafeMessage type from the safe-gateway-typescript-sdk is wrong. The gateway returns a MessageItem
    message = { ...fetchedMessage, type: 'MESSAGE' }
  } catch (err) {
    logError(Errors._613, err)
    throw err
  }

  return message
}

const useSyncSafeMessageSigner = (
  message: MessageItem | undefined,
  decodedMessage: string | TypedData,
  safeMessageHash: string,
  requestId: string | undefined,
  origin: string | undefined,
  onClose: () => void,
) => {
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  // If the message gets updated in the messageSlice we dispatch it if the signature is complete
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined
    if (message?.preparedSignature) {
      timeout = setTimeout(() => dispatchPreparedSignature(message, safeMessageHash, onClose, requestId), HIDE_DELAY)
    }
    return () => clearTimeout(timeout)
  }, [message, safe.chainId, safeMessageHash, onClose, requestId])

  const onSign = useCallback(async () => {
    // Error is shown when no wallet is connected, this appeases TypeScript
    if (!wallet) {
      return
    }

    setSubmitError(undefined)

    try {
      // When collecting the first signature
      if (!message) {
        await dispatchSafeMsgProposal({ provider: wallet.provider, safe, message: decodedMessage, origin })

        // Fetch updated message
        const updatedMsg = await fetchSafeMessage(safeMessageHash, safe.chainId)

        // If threshold 1, we do not want to wait for polling
        if (safe.threshold === 1 && updatedMsg) {
          setTimeout(() => dispatchPreparedSignature(updatedMsg, safeMessageHash, onClose, requestId), HIDE_DELAY)
        }
        return updatedMsg
      } else {
        await dispatchSafeMsgConfirmation({ provider: wallet.provider, safe, message: decodedMessage })

        // No requestID => we are in the confirm message dialog and do not need to leave the window open
        if (!requestId) {
          onClose()
          return
        }

        const updatedMsg = await fetchSafeMessage(safeMessageHash, safe.chainId)
        if (updatedMsg) {
          setTimeout(() => dispatchPreparedSignature(updatedMsg, safeMessageHash, onClose, requestId), HIDE_DELAY)
        }
        return updatedMsg
      }
    } catch (e) {
      setSubmitError(asError(e))
    }
  }, [wallet, safe, message, decodedMessage, origin, safeMessageHash, onClose, requestId])

  return { submitError, onSign }
}

export default useSyncSafeMessageSigner
