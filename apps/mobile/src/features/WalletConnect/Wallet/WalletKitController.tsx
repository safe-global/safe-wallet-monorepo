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
import { useWcToastBridge } from './hooks/useWcToastBridge'
import { isValidTxRequestParams } from './services/methodRouter'
import { setSessions, removeSession, pushPending, isDeferredTxMethod } from './store/walletKitSlice'
import { RequestSheetHost } from './components/RequestSheetHost'
import { logWalletKitError } from './utils/errors'

/**
 * Side-effect component driving WalletConnect-for-dApps: it owns the WalletKit singleton
 * init, session-lifecycle listeners, deep-link pairing and the request sheet host. It
 * renders no layout of its own — it is mounted as a sibling of the navigation tree, never
 * a wrapper.
 *
 * The whole controller is gated behind the NATIVE_WALLETCONNECT chain-config flag. When
 * the active chain does not advertise the feature — or no Safe is active yet, so
 * useHasFeature is undefined — WalletKit is never initialised: no listeners, no request
 * sheet, no singleton init. Flipping the flag (e.g. when the first Safe is imported and an
 * active chain appears) simply runs the init effect; because the controller is a sibling
 * and never wraps the navigation tree, that flip can never unmount or remount navigation.
 */
export const WalletKitController: React.FC = () => {
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const [walletKit, setWalletKit] = useState<IWalletKit | null>(null)

  // Init + seed: mirror the SDK's active sessions and any deferred-tx requests that
  // survived a restart into the slice. Gated on isEnabled so nothing initialises while
  // the feature is off.
  useEffect(() => {
    if (!isEnabled) {
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
        // Restored requests are stamped with the rehydrated active Safe: the sheet always
        // composes against the current active Safe, so that is the context Review would use.
        const restoredSafeAddress = selectActiveSafe(store.getState())?.address
        const pendings = wk.getPendingSessionRequests() as WalletKitTypes.SessionRequest[]
        pendings.forEach((r) => {
          const method = r.params.request.method
          if (!isDeferredTxMethod(method)) {
            return
          }
          // Restored requests never passed routeSessionRequest, so enforce the same param
          // shape here — a malformed bundle would otherwise only blow up inside compose
          // with an unactionable toast. Reject it back to the dApp instead of seeding.
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

  // Subscribe to session lifecycle events. session_proposal is handled by
  // useSessionProposalHandler (WA-2318) and session_request by useSessionRequestHandler
  // (WA-2321). delete/expire keep the slice's session mirror in sync; authenticate is
  // rejected (out of scope).
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const refreshSessions = () => dispatch(setSessions(walletKit.getActiveSessions()))

    const onDelete = ({ topic }: { topic: string }) => dispatch(removeSession(topic))
    // proposal_expire / session_request_expire are the lifecycle-expiry events @reown/walletkit
    // actually surfaces (its event map has no `session_expire` / `session_update`). Re-seed from
    // the SDK so the slice's session mirror can't drift after a prune/expiry.
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

  // Registers the toast controller so the walletKit listener can surface session-request
  // toasts (no-signer / unsupported method / wrong active chain) from outside React.
  useWcToastBridge()

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit)
  useActiveSafeBinding(walletKit)

  return <RequestSheetHost walletKit={walletKit} />
}
