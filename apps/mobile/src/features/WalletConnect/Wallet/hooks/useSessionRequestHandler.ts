import { useEffect } from 'react'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { sessionRequestReceived } from '../store/walletKitSlice'

/**
 * Forwards the WalletKit session_request event to Redux as a signal. The walletKit listener owns
 * routing and side effects, reading context from the store — so this hook holds no stale state.
 */
export const useSessionRequestHandler = (walletKit: IWalletKit | null) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!walletKit) {
      return
    }
    const onRequest = (request: WalletKitTypes.SessionRequest) => {
      dispatch(sessionRequestReceived(request))
    }
    walletKit.on('session_request', onRequest)
    return () => {
      walletKit.off('session_request', onRequest)
    }
  }, [walletKit, dispatch])
}
