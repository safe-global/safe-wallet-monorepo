import { useEffect, useCallback } from 'react'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { useAppDispatch } from '@/src/store/hooks'
import { useStore } from 'react-redux'
import { useToastController } from '@tamagui/toast'
import type { RootState, AppDispatch } from '@/src/store'
import { pushPending, removePending, isDeferredTxMethod } from '../store/walletKitSlice'
import { routeSessionRequest, isDeferredResponse, type RouteContext } from '../services/methodRouter'
import { REJECTED_SIGNING_METHODS } from '../services/constants'

export type SessionRequestHandlerDeps = Omit<RouteContext, 'request' | 'dispatch' | 'getState'>

// Spec: "auto-reject with formatJsonRpcError(id, { code: 4100, ... }) + generic toast".
const NO_SIGNER_ERROR_CODE = 4100

const REJECTED_SIGNING_METHODS_SET: ReadonlySet<string> = new Set(REJECTED_SIGNING_METHODS)

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
        // methodRouter only emits __DEFERRED__ for eth_sendTransaction / wallet_sendCalls,
        // so this narrow type-guard is true by construction — it just propagates that
        // invariant to the slice's tightened method type.
        const method = request.params.request.method
        if (!isDeferredTxMethod(method)) {
          return
        }
        dispatch(
          pushPending({
            kind: 'request',
            id: request.id,
            topic: request.topic,
            chainId: request.params.chainId,
            method,
            params: request.params.request.params,
          }),
        )
        return
      }
      // Swallow stale-topic errors (typical after a Metro reload / long backgrounding —
      // the relayer reconnects and processes backlogged messages that reference sessions
      // WalletKit no longer knows about). Surfacing these to LogBox is noise; the dApp
      // will retry the request.
      try {
        await walletKit.respondSessionRequest({ topic: request.topic, response })
      } catch (e) {
        console.log('[walletKit] respondSessionRequest failed', e)
      }
      // Surface the spec-mandated toast on the no-signer auto-reject path.
      if ('error' in response && response.error?.code === NO_SIGNER_ERROR_CODE) {
        toast.show('No signer attached to this Safe', { native: false, duration: 2500 })
      }
      // Explain rejections of message-signing methods (eth_signTypedData_v4, personal_sign, …) —
      // dApps like CowSwap fire these in parallel with their tx request, and without a toast
      // the user just sees a red "unknown RPC error" in the dApp with no context.
      if (REJECTED_SIGNING_METHODS_SET.has(request.params.request.method)) {
        toast.show('Message signing is not yet supported on mobile', { native: false, duration: 2500 })
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
