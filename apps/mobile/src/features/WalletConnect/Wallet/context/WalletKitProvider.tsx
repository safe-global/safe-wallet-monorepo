import React, { useEffect, useMemo, useState } from 'react'
import * as Linking from 'expo-linking'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { useStore } from 'react-redux'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { type RootState } from '@/src/store'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { getWalletKit } from '../walletKit'
import { useActiveSafeBinding } from '../hooks/useActiveSafeBinding'
import { useSessionProposalHandler } from '../hooks/useSessionProposalHandler'
import { useSessionRequestHandler, type SessionRequestHandlerDeps } from '../hooks/useSessionRequestHandler'
import { isValidTxRequestParams } from '../services/methodRouter'
import { setSessions, removeSession, pushPending, isDeferredTxMethod } from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { logWalletKitError } from '../utils/errors'

export const WalletKitProvider: React.FC = () => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const [walletKit, setWalletKit] = useState<IWalletKit | null>(null)

  // Init + seed: mirror the SDK's active sessions and any deferred-tx requests that
  // survived a restart into the slice.
  useEffect(() => {
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
  }, [dispatch, store])

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

  // Active context for the session-request router, read from local slices so cold-start
  // requests aren't rejected while CGW fetches are in flight (the compose path loads the
  // full SafeState itself); `hasSigner` gates tx requests with 4100.
  const activeSafe = useAppSelector(selectActiveSafe)
  const activeChain = useAppSelector((s) => (activeSafe ? (selectChainById(s, activeSafe.chainId) ?? null) : null))
  const activeSigner = useAppSelector((s) => (activeSafe ? selectActiveSigner(s, activeSafe.address) : undefined))

  const deps: SessionRequestHandlerDeps = useMemo(
    () => ({
      activeChain: activeChain ?? null,
      activeSafeAddress: activeSafe?.address ?? null,
      hasSigner: !!activeSigner,
    }),
    [activeChain, activeSafe?.address, activeSigner],
  )

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit, deps)
  useActiveSafeBinding(walletKit)

  return <RequestSheetHost walletKit={walletKit} />
}
