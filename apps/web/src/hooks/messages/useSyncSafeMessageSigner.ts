import type { TypedData, MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeSignerAddress from '@/hooks/wallets/useSafeSignerAddress'
import { Errors, logError } from '@/services/exceptions'
import { asError, getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import { dispatchPreparedSignature } from '@/services/safe-messages/safeMsgNotifications'
import { dispatchSafeMsgProposal, dispatchSafeMsgConfirmation } from '@/services/safe-messages/safeMsgSender'
import { useEffect, useCallback, useRef, useState } from 'react'
import useSafeInfo from '../useSafeInfo'
import { getStoreInstance } from '@/store'
import { backOff } from 'exponential-backoff'

const HIDE_DELAY = 3000

const queryMessage = async (safeMessageHash: string, chainId: string): Promise<MessageItem> => {
  // Use RTK Query endpoint to fetch message
  const store = getStoreInstance()
  const result = await store.dispatch(
    cgwApi.endpoints.messagesGetMessageByHashV1.initiate(
      { chainId, messageHash: safeMessageHash },
      {
        forceRefetch: true,
      },
    ),
  )

  if ('data' in result && result.data) {
    // Convert Message to MessageItem by adding the type field
    return { ...result.data, type: 'MESSAGE' as const }
  }
  throw 'error' in result ? asError(result.error) : new Error('Failed to fetch message')
}

export const fetchSafeMessage = async (safeMessageHash: string, chainId: string): Promise<MessageItem | undefined> => {
  try {
    return await queryMessage(safeMessageHash, chainId)
  } catch (err) {
    logError(Errors._613, err)
    throw err
  }
}

// CGW can serve a cached 404 until the MESSAGE_CONFIRMATION event clears it (up to ~33 s)
const fetchSignedSafeMessage = async (
  safeMessageHash: string,
  chainId: string,
  isMounted: () => boolean,
): Promise<MessageItem> => {
  try {
    return await backOff(() => queryMessage(safeMessageHash, chainId), {
      startingDelay: 1000,
      maxDelay: 5000,
      numOfAttempts: 9,
      retry: (err) => isMounted() && getHttpStatusFromError(err) === 404,
    })
  } catch (err) {
    logError(Errors._613, err)
    throw err
  }
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
  const safeSignerAddress = useSafeSignerAddress()
  const { safe } = useSafeInfo()
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

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

    const closeIfMounted = () => {
      if (isMountedRef.current) onClose()
    }

    try {
      // When collecting the first signature
      if (!message) {
        await dispatchSafeMsgProposal({
          provider: wallet.provider,
          safe,
          message: decodedMessage,
          origin,
          safeSignerAddress,
        })

        // Fetch updated message
        const updatedMsg = await fetchSignedSafeMessage(safeMessageHash, safe.chainId, () => isMountedRef.current)

        // If threshold 1, we do not want to wait for polling
        if (safe.threshold === 1 && updatedMsg) {
          setTimeout(
            () => dispatchPreparedSignature(updatedMsg, safeMessageHash, closeIfMounted, requestId),
            HIDE_DELAY,
          )
        }
        return updatedMsg
      } else {
        await dispatchSafeMsgConfirmation({
          provider: wallet.provider,
          safe,
          message: decodedMessage,
          safeSignerAddress,
        })

        // No requestID => we are in the confirm message dialog and do not need to leave the window open
        if (!requestId) {
          closeIfMounted()
          return
        }

        const updatedMsg = await fetchSignedSafeMessage(safeMessageHash, safe.chainId, () => isMountedRef.current)
        if (updatedMsg) {
          setTimeout(
            () => dispatchPreparedSignature(updatedMsg, safeMessageHash, closeIfMounted, requestId),
            HIDE_DELAY,
          )
        }
        return updatedMsg
      }
    } catch (e) {
      setSubmitError(asError(e))
    }
  }, [wallet, safeSignerAddress, safe, message, decodedMessage, origin, safeMessageHash, onClose, requestId])

  return { submitError, onSign }
}

export default useSyncSafeMessageSigner
