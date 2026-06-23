import { useEffect } from 'react'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { sessionRequestReceived } from '../store/walletKitSlice'

/**
 * Subscribes to the WalletKit session_request event and dispatches it as a Redux signal.
 * Routing and all side effects (respond / pushPending / toast) live in the walletKit listener
 * middleware, which reads the active Safe/chain/signer from the store at process time — so this
 * hook holds no active context and never closes over stale React state.
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
