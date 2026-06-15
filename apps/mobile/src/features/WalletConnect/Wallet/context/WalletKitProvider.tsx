import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError, formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { isAnyOf } from '@reduxjs/toolkit'
import { useStore } from 'react-redux'
import { isPairingUri, stripEip155Prefix } from '@safe-global/utils/features/walletconnect/utils'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { startAppListening, type RootState } from '@/src/store'
import { selectActiveSafe, setActiveSafe, switchActiveChain, clearActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { getWalletKit } from '../walletKit'
import { useActiveSafeBinding } from '../hooks/useActiveSafeBinding'
import { useSessionProposalHandler } from '../hooks/useSessionProposalHandler'
import { useSessionRequestHandler, type SessionRequestHandlerDeps } from '../hooks/useSessionRequestHandler'
import { isValidTxRequestParams } from '../services/methodRouter'
import { proxyReadOnlyCall } from '../services/readRpcProxy'
import { buildGetCallsResult, type RawTxReceipt } from '../services/getCallsStatus'
import {
  setSessions,
  removeSession,
  pushPending,
  removePending,
  isDeferredTxMethod,
  clearOutstandingRequest,
  setOutstandingProposing,
  selectOutstandingRequestByHash,
  selectOutstandingRequests,
  selectPending,
  type PendingSessionRequest,
} from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { logWalletKitError } from '../utils/errors'

export const WalletKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Respond to the dApp once the user has actually signed. The existing confirm flow calls
  // transactionsProposeTransactionV1 after signing; match its fulfilled action against any
  // outstanding tx request keyed by safeTxHash and reply with the hash (or { id } for 5792).
  // The pending/rejected matchers maintain the `proposing` flag so WcRejectOnBack can't
  // race the success response with a USER_REJECTED while /propose is in flight.
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const safeTxHashOf = (action: { meta: { arg: { originalArgs: unknown } } }) =>
      (action.meta.arg.originalArgs as { proposeTransactionDto?: { safeTxHash?: string } }).proposeTransactionDto
        ?.safeTxHash
    const unsubscribers = [
      startAppListening({
        matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchPending,
        effect: async (action, api) => {
          const safeTxHash = safeTxHashOf(action)
          if (safeTxHash) {
            api.dispatch(setOutstandingProposing({ safeTxHash, proposing: true }))
          }
        },
      }),
      startAppListening({
        // A failed /propose keeps the draft (AC) — re-enable reject-on-back for it.
        matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchRejected,
        effect: async (action, api) => {
          const safeTxHash = safeTxHashOf(action)
          if (safeTxHash) {
            api.dispatch(setOutstandingProposing({ safeTxHash, proposing: false }))
          }
        },
      }),
      startAppListening({
        matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchFulfilled,
        effect: async (action, api) => {
          const safeTxHash = safeTxHashOf(action)
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
      }),
    ]
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [walletKit])

  // A Safe/chain switch invalidates WC tx requests in both stages: handed-off entries lose
  // their draft to draftTxSlice's cleanup on the same actions, and pre-compose sheet entries
  // would otherwise let Review compose the dApp's calls against the wrong Safe. Reject the
  // stale entries so the dApp doesn't hang until the WC timeout (mirrors draftTxSlice's
  // isSameSafe semantics; entries matching the new active Safe are kept). Clearing a pending
  // entry also dismisses its sheet via the FIFO head.
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const respondRejected = async (topic: string, id: number) => {
      try {
        await walletKit.respondSessionRequest({
          topic,
          response: formatJsonRpcError(id, getSdkError('USER_REJECTED').message),
        })
      } catch (e) {
        logWalletKitError('respondSessionRequest after Safe switch failed', e)
      }
    }
    const unsubscribe = startAppListening({
      matcher: isAnyOf(setActiveSafe, switchActiveChain, clearActiveSafe),
      effect: async (action, api) => {
        // For clearActiveSafe (and setActiveSafe(null)) both `next` and `nextChainId` stay
        // undefined, so matchesNext is false for every entry — all requests get rejected.
        const next = setActiveSafe.match(action) ? action.payload : null
        const nextChainId = switchActiveChain.match(action) ? action.payload.chainId : next?.chainId
        // switchActiveChain keeps the Safe address; the other actions carry the full context.
        // An unknown (undefined) entry address never matches — the conservative choice.
        const matchesNext = (chainId: string, safeAddress: string | undefined) => {
          if (chainId !== nextChainId) {
            return false
          }
          return switchActiveChain.match(action) ? true : sameAddress(safeAddress, next?.address)
        }

        // Handed-off requests (waiting on /propose) + pre-compose requests still showing
        // (or queued behind) the sheet. Clear the state first so the UI dismisses
        // immediately, then send all rejections in parallel — a slow relay must not
        // serialize the cleanup (respondRejected swallows its own errors).
        const staleOutstanding = Object.entries(selectOutstandingRequests(api.getState())).filter(
          ([, req]) => !matchesNext(req.chainId, req.safeAddress),
        )
        const stalePending = selectPending(api.getState())
          .filter((p): p is PendingSessionRequest => p.kind === 'request')
          .filter((p) => !matchesNext(stripEip155Prefix(p.chainId), p.safeAddress))

        staleOutstanding.forEach(([safeTxHash]) => api.dispatch(clearOutstandingRequest(safeTxHash)))
        stalePending.forEach((p) => api.dispatch(removePending({ id: p.id, kind: 'request' })))

        await Promise.all([
          ...staleOutstanding.map(([, req]) => respondRejected(req.topic, req.id)),
          ...stalePending.map((p) => respondRejected(p.topic, p.id)),
        ])
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

  // Active context for the session-request router, read from local slices so cold-start
  // requests aren't rejected while CGW fetches are in flight (the compose path loads the
  // full SafeState itself); `hasSigner` gates tx requests with 4100.
  const activeSafe = useAppSelector(selectActiveSafe)
  const activeChain = useAppSelector((s) => (activeSafe ? (selectChainById(s, activeSafe.chainId) ?? null) : null))
  const activeSigner = useAppSelector((s) => (activeSafe ? selectActiveSigner(s, activeSafe.address) : undefined))

  // wallet_switchEthereumChain — only allow chains the active Safe is deployed on (derived
  // from the safes slice, the same source the proposal handler uses). useActiveSafeBinding
  // re-syncs the WC sessions off the resulting switchActiveChain dispatch, so no explicit
  // walletKit.updateSession is needed here.
  const switchActiveChainByCaip2: SessionRequestHandlerDeps['switchActiveChainByCaip2'] = useCallback(
    async (caip2) => {
      const chainId = stripEip155Prefix(caip2)
      const state = store.getState()
      if (!selectChainById(state, chainId)) {
        return { ok: false, reason: 'NOT_DEPLOYED' }
      }
      const safeAddress = selectActiveSafe(state)?.address
      const safeChains = safeAddress ? Object.keys(state.safes[safeAddress] ?? {}) : []
      if (!safeChains.includes(chainId)) {
        return { ok: false, reason: 'NOT_DEPLOYED' }
      }
      dispatch(switchActiveChain({ chainId }))
      return { ok: true }
    },
    [store, dispatch],
  )

  // wallet_getCallsStatus — local Safe-tx status enriched with the on-chain receipt (mirrors
  // apps/web/.../safe-wallet-provider/index.ts). Throws 'Transaction not found' for an unknown
  // id; the router converts that to a JSON-RPC error.
  const getCallsStatus: SessionRequestHandlerDeps['getCallsStatus'] = useCallback(
    async (chainId, id) => {
      const numericChainId = stripEip155Prefix(chainId)

      let tx
      try {
        tx = await dispatch(
          cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({ chainId: numericChainId, id }),
        ).unwrap()
      } catch {
        throw new Error('Transaction not found')
      }

      // Fetch the on-chain receipt only once there's a tx hash to look up and the chain config
      // is available; buildGetCallsResult tolerates a null receipt (a pending bundle).
      let receipt: RawTxReceipt | null = null
      if (tx.txHash) {
        const chain = selectChainById(store.getState(), numericChainId)
        if (chain) {
          try {
            receipt = (await proxyReadOnlyCall(chain, 'eth_getTransactionReceipt', [tx.txHash])) as RawTxReceipt | null
          } catch {
            receipt = null
          }
        }
      }

      return buildGetCallsResult(id, numericChainId, tx, receipt)
    },
    [dispatch, store],
  )

  const navigateToCallsStatus: SessionRequestHandlerDeps['navigateToCallsStatus'] = useCallback((chainId, id) => {
    router.push({ pathname: '/pending-transactions', params: { chainId, txId: id } })
  }, [])

  const deps: SessionRequestHandlerDeps = useMemo(
    () => ({
      activeChain: activeChain ?? null,
      activeSafeAddress: activeSafe?.address ?? null,
      hasSigner: !!activeSigner,
      switchActiveChainByCaip2,
      getCallsStatus,
      navigateToCallsStatus,
    }),
    [activeChain, activeSafe?.address, activeSigner, switchActiveChainByCaip2, getCallsStatus, navigateToCallsStatus],
  )

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit, deps)
  useActiveSafeBinding(walletKit)

  return (
    <>
      {children}
      <RequestSheetHost walletKit={walletKit} />
    </>
  )
}
