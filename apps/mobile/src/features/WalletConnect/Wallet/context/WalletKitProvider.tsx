import React, { useEffect, useMemo, useState } from 'react'
import * as Linking from 'expo-linking'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { startAppListening } from '@/src/store'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { getWalletKit } from '../walletKit'
import { useActiveSafeBinding } from '../hooks/useActiveSafeBinding'
import { useSessionProposalHandler } from '../hooks/useSessionProposalHandler'
import { useSessionRequestHandler, type SessionRequestHandlerDeps } from '../hooks/useSessionRequestHandler'
import {
  setSessions,
  removeSession,
  pushPending,
  isDeferredTxMethod,
  clearOutstandingRequest,
  selectOutstandingRequestByHash,
} from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { logWalletKitError } from '../utils/errors'

export const WalletKitProvider: React.FC = () => {
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
              verifyContext: r.verifyContext,
            }),
          )
        })
      })
      .catch((e) => logWalletKitError('init failed', e))
    return () => {
      mounted = false
    }
  }, [dispatch])

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

  // Respond to the dApp once the user has actually signed. The existing confirm flow calls
  // transactionsProposeTransactionV1 after signing; match its fulfilled action against any
  // outstanding tx request keyed by safeTxHash and reply with the hash (or { id } for 5792).
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const unsubscribe = startAppListening({
      matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchFulfilled,
      effect: async (action, api) => {
        const arg = action.meta.arg.originalArgs as { proposeTransactionDto?: { safeTxHash?: string } }
        const safeTxHash = arg.proposeTransactionDto?.safeTxHash
        if (!safeTxHash) {
          return
        }
        const outstanding = selectOutstandingRequestByHash(api.getState(), safeTxHash)
        if (!outstanding) {
          return
        }
        const result = outstanding.method === 'wallet_sendCalls' ? { id: safeTxHash } : safeTxHash
        try {
          await walletKit.respondSessionRequest({
            topic: outstanding.topic,
            response: formatJsonRpcResult(outstanding.id, result),
          })
        } catch (e) {
          logWalletKitError('respondSessionRequest after propose failed', e)
        }
        api.dispatch(clearOutstandingRequest(safeTxHash))
      },
    })
    return () => {
      unsubscribe()
    }
  }, [walletKit])

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

  // Active context for the session-request router. `safe` is the full SafeState (owners,
  // threshold, version) the compose path needs; `hasSigner` gates tx requests with 4100.
  const activeSafe = useAppSelector(selectActiveSafe)
  const activeChain = useAppSelector((s) => (activeSafe ? (selectChainById(s, activeSafe.chainId) ?? null) : null))
  const { data: safe } = useSafesGetSafeV1Query(
    activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
  )
  const activeSigner = useAppSelector((s) => (activeSafe ? selectActiveSigner(s, activeSafe.address) : undefined))

  const deps: SessionRequestHandlerDeps = useMemo(
    () => ({ activeChain: activeChain ?? null, activeSafe: safe ?? null, hasSigner: !!activeSigner }),
    [activeChain, safe, activeSigner],
  )

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit, deps)
  useActiveSafeBinding(walletKit)

  return <RequestSheetHost walletKit={walletKit} />
}
