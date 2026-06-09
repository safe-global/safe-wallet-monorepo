import { useCallback, useState } from 'react'
import { getSdkError } from '@walletconnect/utils'
import { useToastController } from '@tamagui/toast'
import { useAppDispatch } from '@/src/store/hooks'
import { removeSession } from '../store/walletKitSlice'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'

/**
 * Shared teardown for a connected dApp: tell the relay the user disconnected, then drop the
 * session from the slice. `busyTopic` lets callers disable the row being torn down. On failure
 * the slice entry is left intact (the relay call is the source of truth) so the user can retry;
 * the technical error is logged and a generic toast is shown.
 */
export const useDisconnectSession = () => {
  const dispatch = useAppDispatch()
  const toast = useToastController()
  const [busyTopic, setBusyTopic] = useState<string | null>(null)

  const disconnect = useCallback(
    async (topic: string, peerName?: string) => {
      setBusyTopic(topic)
      try {
        const wk = await getWalletKit()
        await wk.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') })
        dispatch(removeSession(topic))
        toast.show(`${peerName ?? 'App'} disconnected`, { native: false, duration: 2500 })
      } catch (e) {
        logWalletKitError('disconnectSession failed', e)
        toast.show('Failed to disconnect', { native: false, duration: 2500, variant: 'error' })
      } finally {
        setBusyTopic(null)
      }
    },
    [dispatch, toast],
  )

  return { disconnect, busyTopic }
}
