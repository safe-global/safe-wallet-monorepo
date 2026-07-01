import React, { useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { useStore } from 'react-redux'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { useAppDispatch } from '@/src/store/hooks'
import { type RootState } from '@/src/store'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { getWalletKit } from './walletKit'
import { useActiveSafeBinding } from './hooks/useActiveSafeBinding'
import { useSessionProposalHandler } from './hooks/useSessionProposalHandler'
import { useSessionRequestHandler } from './hooks/useSessionRequestHandler'
import { isValidTxRequestParams } from './services/methodRouter'
import { setSessions, removeSession, pushPending, isDeferredTxMethod } from './store/walletKitSlice'
import { RequestSheetHost } from './components/RequestSheetHost'
import { logWalletKitError } from './utils/errors'

/**
 * Side-effect component for WalletConnect-for-dApps: WalletKit init, session-lifecycle
 * listeners, deep-link pairing and the request sheet host. Renders no layout — mounted as a
 * sibling of the navigation tree (never a wrapper), so flipping the NATIVE_WALLETCONNECT flag
 * just runs the init effect and can't unmount navigation. When the flag is off WalletKit is
 * never initialised.
 */
export const WalletKitController: React.FC = () => {
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const [walletKit, setWalletKit] = useState<IWalletKit | null>(null)

  // Init + seed the slice from the SDK's active sessions and restart-surviving tx requests.
  useEffect(() => {
    if (!isEnabled) {
      setWalletKit(null)
      return
    }
    let mounted = true
    getWalletKit()
      .then((wk) => {
        if (!mounted) {
          return
        }
        setWalletKit(wk)
        dispatch(setSessions(wk.getActiveSessions()))
        // Stamp restored requests with the active Safe — the context Review composes against.
        const restoredSafeAddress = selectActiveSafe(store.getState())?.address
        const pendings = wk.getPendingSessionRequests() as WalletKitTypes.SessionRequest[]
        pendings.forEach((r) => {
          const method = r.params.request.method
          if (!isDeferredTxMethod(method)) {
            return
          }
          // Restored requests skipped routeSessionRequest — re-validate, rejecting malformed ones.
          if (!isValidTxRequestParams(method, r.params.request.params)) {
            wk.respondSessionRequest({
              topic: r.topic,
              response: formatJsonRpcError(r.id, { code: -32602, message: 'Invalid call parameters.' }),
            }).catch((e) => logWalletKitError('respondSessionRequest (restored, invalid params) failed', e))
            return
          }
          dispatch(
            pushPending({
              kind: 'request',
              id: r.id,
              topic: r.topic,
              chainId: r.params.chainId,
              method,
              params: r.params.request.params,
              safeAddress: restoredSafeAddress,
              verifyContext: r.verifyContext,
            }),
          )
        })
      })
      .catch((e) => logWalletKitError('init failed', e))
    return () => {
      mounted = false
    }
  }, [dispatch, store, isEnabled])

  // Lifecycle events: delete/expire keep the session mirror in sync, authenticate is rejected
  // (out of scope). session_proposal/session_request are handled by their own hooks.
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const refreshSessions = () => dispatch(setSessions(walletKit.getActiveSessions()))

    const onDelete = ({ topic }: { topic: string }) => dispatch(removeSession(topic))
    // proposal_expire / session_request_expire are the expiry events @reown/walletkit surfaces;
    // re-seed from the SDK so the session mirror can't drift after a prune.
    const onProposalExpire = () => refreshSessions()
    const onRequestExpire = () => refreshSessions()
    const onAuthenticate = async ({ id }: { id: number }) => {
      try {
        await walletKit.rejectSessionAuthenticate({ id, reason: getSdkError('UNSUPPORTED_METHODS') })
      } catch (e) {
        logWalletKitError('rejectSessionAuthenticate failed', e)
      }
    }

    walletKit.on('session_delete', onDelete)
    walletKit.on('proposal_expire', onProposalExpire)
    walletKit.on('session_request_expire', onRequestExpire)
    walletKit.on('session_authenticate', onAuthenticate)

    return () => {
      walletKit.off('session_delete', onDelete)
      walletKit.off('proposal_expire', onProposalExpire)
      walletKit.off('session_request_expire', onRequestExpire)
      walletKit.off('session_authenticate', onAuthenticate)
    }
  }, [walletKit, dispatch])

  // Deep-link listener: wc: URIs arriving via the OS land here.
  useEffect(() => {
    if (!walletKit) {
      return
    }
    let cancelled = false
    const handleUrl = async (url: string) => {
      if (!isPairingUri(url)) {
        return
      }
      try {
        await walletKit.pair({ uri: url })
      } catch (e) {
        logWalletKitError('deep-link pair failed', e)
      }
    }
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url)
    })
    // Guard against resolving after unmount (symmetry with the init effect).
    Linking.getInitialURL().then((url) => {
      if (url && !cancelled) {
        void handleUrl(url)
      }
    })
    return () => {
      cancelled = true
      sub.remove()
    }
  }, [walletKit])

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit)
  useActiveSafeBinding(walletKit)

  return <RequestSheetHost walletKit={walletKit} />
}
