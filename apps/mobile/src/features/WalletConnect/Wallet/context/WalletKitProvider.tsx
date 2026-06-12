import React, { useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { useAppDispatch } from '@/src/store/hooks'
import { getWalletKit } from '../walletKit'
import { useActiveSafeBinding } from '../hooks/useActiveSafeBinding'
import { useSessionProposalHandler } from '../hooks/useSessionProposalHandler'
import { setSessions, removeSession, pushPending, isDeferredTxMethod } from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { logWalletKitError } from '../utils/errors'

export const WalletKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
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
        const pendings = wk.getPendingSessionRequests() as WalletKitTypes.SessionRequest[]
        pendings.forEach((r) => {
          const method = r.params.request.method
          if (!isDeferredTxMethod(method)) {
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
            }),
          )
        })
      })
      .catch((e) => logWalletKitError('init failed', e))
    return () => {
      mounted = false
    }
  }, [dispatch])

  // Subscribe to session events. session_proposal is handled by useSessionProposalHandler
  // (WA-2318). session_request handling is wired in WA-2321/2322. delete/expire/update keep
  // the slice's session mirror in sync; authenticate is rejected (out of scope).
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const refreshSessions = () => dispatch(setSessions(walletKit.getActiveSessions()))

    const onRequest = (r: WalletKitTypes.SessionRequest) => {
      // TODO(WA-2321 / WA-2322): route + render request sheets.
      console.log('[walletKit] session_request (stub)', r.id)
    }
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

    walletKit.on('session_request', onRequest)
    walletKit.on('session_delete', onDelete)
    walletKit.on('proposal_expire', onProposalExpire)
    walletKit.on('session_request_expire', onRequestExpire)
    walletKit.on('session_authenticate', onAuthenticate)

    return () => {
      walletKit.off('session_request', onRequest)
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
  useActiveSafeBinding(walletKit)

  return (
    <>
      {children}
      <RequestSheetHost walletKit={walletKit} />
    </>
  )
}
