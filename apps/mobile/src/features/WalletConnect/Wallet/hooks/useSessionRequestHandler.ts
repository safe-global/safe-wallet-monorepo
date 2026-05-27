import { useEffect, useCallback } from 'react'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { useStore } from 'react-redux'
import { useToastController } from '@tamagui/toast'
import type { RootState, AppDispatch } from '@/src/store'
import { pushPending, removePending } from '../store/walletKitSlice'
import { routeSessionRequest, isDeferredResponse, type RouteContext } from '../services/methodRouter'

export type SessionRequestHandlerDeps = Omit<RouteContext, 'request' | 'dispatch' | 'getState'>

// Spec: "auto-reject with formatJsonRpcError(id, { code: 4100, ... }) + generic toast".
const NO_SIGNER_ERROR_CODE = 4100

export const useSessionRequestHandler = (walletKit: IWalletKit | null, deps: SessionRequestHandlerDeps) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const toast = useToastController()

  const handleRequest = useCallback(
    async (request: WalletKitTypes.SessionRequest) => {
      if (!walletKit) {
        return
      }
      const ctx: RouteContext = {
        request,
        dispatch: dispatch as AppDispatch,
        getState: store.getState,
        ...deps,
      }
      const response = await routeSessionRequest(ctx)
      if (isDeferredResponse(response)) {
        // UI sheet will respond later. Push to pending so the host can render it.
        dispatch(
          pushPending({
            kind: 'request',
            id: request.id,
            topic: request.topic,
            chainId: request.params.chainId,
            method: request.params.request.method,
            params: request.params.request.params,
          }),
        )
        return
      }
      await walletKit.respondSessionRequest({ topic: request.topic, response })
      // Surface the spec-mandated toast on the no-signer auto-reject path.
      if ('error' in response && response.error?.code === NO_SIGNER_ERROR_CODE) {
        toast.show('No signer attached to this Safe', { native: false, duration: 2500 })
      }
      // Ensure no stray pending entry for this id.
      dispatch(removePending({ id: request.id, kind: 'request' }))
    },
    [walletKit, dispatch, store, deps, toast],
  )

  useEffect(() => {
    if (!walletKit) {
      return
    }
    walletKit.on('session_request', handleRequest)
    return () => {
      walletKit.off('session_request', handleRequest)
    }
  }, [walletKit, handleRequest])
}
