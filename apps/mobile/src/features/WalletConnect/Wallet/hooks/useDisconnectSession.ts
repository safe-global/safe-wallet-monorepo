import { useCallback, useState } from 'react'
import { getSdkError } from '@walletconnect/utils'
import { useAppDispatch } from '@/src/store/hooks'
import { showToast } from '@/src/store/toastSlice'
import { removeSession } from '../store/walletKitSlice'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'

/**
 * Disconnects a dApp: tells the relay then drops the session from the slice, returning whether it
 * succeeded so callers can keep a confirmation open to retry. `busyTopic` tracks a single in-flight
 * teardown — screen-scoped, one row at a time (use a Set if ever called concurrently per-row).
 */
export const useDisconnectSession = () => {
  const dispatch = useAppDispatch()
  const [busyTopic, setBusyTopic] = useState<string | null>(null)

  const disconnect = useCallback(
    async (topic: string, peerName?: string): Promise<boolean> => {
      setBusyTopic(topic)
      try {
        const wk = await getWalletKit()
        await wk.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') })
        dispatch(removeSession(topic))
        dispatch(showToast({ message: `${peerName ?? 'App'} disconnected`, duration: 2500 }))
        return true
      } catch (e) {
        logWalletKitError('disconnectSession failed', e)
        dispatch(showToast({ message: 'Failed to disconnect', duration: 2500, variant: 'error' }))
        return false
      } finally {
        setBusyTopic(null)
      }
    },
    [dispatch],
  )

  return { disconnect, busyTopic }
}
