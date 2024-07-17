import { Errors, logError } from '@/services/exceptions'
import { asError } from '@/services/exceptions/utils'
import { dispatchPreparedSignature } from '@/services/safe-messages/safeMsgNotifications'
import { dispatchSafeMsgProposal, dispatchSafeMsgConfirmation } from '@/services/safe-messages/safeMsgSender'
import {
  getSafeMessage,
  SafeMessageListItemType,
  type EIP712TypedData,
  type SafeMessage,
} from '@safe-global/safe-gateway-typescript-sdk'
import { useEffect, useCallback, useState } from 'react'
import useSafeInfo from '../useSafeInfo'
import useOnboard from '../wallets/useOnboard'
import useWallet from '../wallets/useWallet'

const HIDE_DELAY = 3000

const fetchSafeMessage = async (safeMessageHash: string, chainId: string) => {
  let message: SafeMessage | undefined
  try {
    // fetchedMessage does not have a type because it is explicitly a message
    const fetchedMessage = await getSafeMessage(chainId, safeMessageHash)
    message = { ...fetchedMessage, type: SafeMessageListItemType.MESSAGE }
  } catch (err) {
    logError(Errors._613, err)
    throw err
  }

  return message
}

const useSyncSafeMessageSigner = (
  message: SafeMessage | undefined,
  decodedMessage: string | EIP712TypedData,
  safeMessageHash: string,
  requestId: string | undefined,
  safeAppId: number | undefined,
  onClose: () => void,
) => {
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const onboard = useOnboard()
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
        await dispatchSafeMsgProposal({ wallet, safe, message: decodedMessage, safeAppId })

        // Fetch updated message
        const updatedMsg = await fetchSafeMessage(safeMessageHash, safe.chainId)

        // If threshold 1, we do not want to wait for polling
        if (safe.threshold === 1) {
          setTimeout(() => dispatchPreparedSignature(updatedMsg, safeMessageHash, onClose, requestId), HIDE_DELAY)
        }
        return updatedMsg
      } else {
        await dispatchSafeMsgConfirmation({ wallet, safe, message: decodedMessage })

        // No requestID => we are in the confirm message dialog and do not need to leave the window open
        if (!requestId) {
          onClose()
          return
        }

        const updatedMsg = await fetchSafeMessage(safeMessageHash, safe.chainId)
        setTimeout(() => dispatchPreparedSignature(updatedMsg, safeMessageHash, onClose, requestId), HIDE_DELAY)
        return updatedMsg
      }
    } catch (e) {
      setSubmitError(asError(e))
    }
  }, [onboard, requestId, message, safe, decodedMessage, safeAppId, safeMessageHash, onClose])

  return { submitError, onSign }
}

export default useSyncSafeMessageSigner
