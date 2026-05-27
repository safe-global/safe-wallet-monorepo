import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcResult } from '@walletconnect/jsonrpc-utils'
import { skipToken } from '@reduxjs/toolkit/query'
import { useStore } from 'react-redux'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import type { RootState } from '@/src/store'
import { startAppListening } from '@/src/store'
import { getWalletKit } from '../walletKit'
import { useSessionProposalHandler } from '../hooks/useSessionProposalHandler'
import { useSessionRequestHandler, type SessionRequestHandlerDeps } from '../hooks/useSessionRequestHandler'
import { useSessionDeleteHandler } from '../hooks/useSessionDeleteHandler'
import { useActiveSafeBinding } from '../hooks/useActiveSafeBinding'
import {
  setSessions,
  pushPending,
  clearOutstandingRequest,
  selectOutstandingRequestByHash,
} from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { selectActiveSafe, switchActiveChain } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Only seed pending requests that the UI can act on. Read-only methods that survived
// across restart would just hang in the slice with no sheet to render them.
const DEFERRED_METHODS = new Set(['eth_sendTransaction', 'wallet_sendCalls'])

export const WalletKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const [walletKit, setWalletKit] = useState<IWalletKit | null>(null)

  // Init + seed.
  useEffect(() => {
    let mounted = true
    getWalletKit()
      .then((wk) => {
        if (!mounted) {
          return
        }
        setWalletKit(wk)
        dispatch(setSessions(wk.getActiveSessions()))
        const pendings = wk.getPendingSessionRequests()
        ;(pendings as WalletKitTypes.SessionRequest[]).forEach((r) => {
          if (!DEFERRED_METHODS.has(r.params.request.method)) {
            return
          }
          dispatch(
            pushPending({
              kind: 'request',
              id: r.id,
              topic: r.topic,
              chainId: r.params.chainId,
              method: r.params.request.method,
              params: r.params.request.params,
            }),
          )
        })
      })
      .catch((e) => console.log('[walletKit] init failed', e))
    return () => {
      mounted = false
    }
  }, [dispatch])

  // Reject session_authenticate (out of scope per spec).
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const onAuth = async ({ id }: { id: number }) => {
      // Swallow stale-auth errors (replays from a backlogged relay after Metro reload).
      try {
        await walletKit.rejectSessionAuthenticate({
          id,
          reason: getSdkError('UNSUPPORTED_METHODS'),
        })
      } catch (e) {
        console.log('[walletKit] rejectSessionAuthenticate failed', e)
      }
    }
    walletKit.on('session_authenticate', onAuth)
    return () => {
      walletKit.off('session_authenticate', onAuth)
    }
  }, [walletKit])

  // Respond to the dApp when the user has actually signed.
  // The existing review-and-confirm flow calls transactionsProposeTransactionV1 after signing;
  // we match its fulfilled action against any outstanding tx request keyed by safeTxHash.
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const unsubscribe = startAppListening({
      matcher: cgwApi.endpoints.transactionsProposeTransactionV1.matchFulfilled,
      effect: async (action, api) => {
        // The arg shape: { chainId, safeAddress, transactionV1Dto: { safeTxHash, ... } }.
        const arg = action.meta.arg.originalArgs as {
          transactionV1Dto?: { safeTxHash?: string }
        }
        const safeTxHash = arg.transactionV1Dto?.safeTxHash
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
          console.log('[walletKit] respondSessionRequest after propose failed', e)
        }
        api.dispatch(clearOutstandingRequest(safeTxHash))
      },
    })
    return () => {
      unsubscribe()
    }
  }, [walletKit])

  // Deep-link listener: wc:// URIs from the OS land here.
  useEffect(() => {
    if (!walletKit) {
      return
    }
    const handleUrl = async (url: string) => {
      if (!url.startsWith('wc:')) {
        return
      }
      try {
        await walletKit.pair({ uri: url })
      } catch (e) {
        console.log('[walletKit] deep-link pair failed', e)
      }
    }
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url)
    })
    Linking.getInitialURL().then((url) => {
      if (url) {
        void handleUrl(url)
      }
    })
    return () => {
      sub.remove()
    }
  }, [walletKit])

  // Build router deps.
  const activeSafe = useAppSelector(selectActiveSafe)
  const activeChain = useAppSelector((s) => (activeSafe ? (selectChainById(s, activeSafe.chainId) ?? null) : null))
  const { data: safe } = useSafesGetSafeV1Query(
    activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
  )
  const activeSigner = useAppSelector((s) => (activeSafe ? selectActiveSigner(s, activeSafe.address) : undefined))

  const switchActiveChainByCaip2: SessionRequestHandlerDeps['switchActiveChainByCaip2'] = useCallback(
    async (caip2) => {
      const [, chainId] = caip2.split(':')
      const state = store.getState()
      const chain = selectChainById(state, chainId)
      if (!chain) {
        return { ok: false, reason: 'NOT_DEPLOYED' }
      }
      // Only allow chains the Safe is deployed on. Derive from safesSlice — the
      // proposal handler uses the same path.
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

  const getCallsStatus: SessionRequestHandlerDeps['getCallsStatus'] = useCallback(
    async (chainId, id) => {
      // EIP-5792 status mapping for a Safe tx hash:
      //   100 = PENDING (not yet executed on-chain or awaiting confirmations)
      //   200 = CONFIRMED (executed and mined)
      //   400 = REVERTED / CANCELLED
      try {
        const tx = await dispatch(cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({ chainId, id })).unwrap()
        const status =
          tx.txStatus === 'SUCCESS' ? 200 : tx.txStatus === 'FAILED' || tx.txStatus === 'CANCELLED' ? 400 : 100
        return { status }
      } catch {
        return { status: 100 }
      }
    },
    [dispatch],
  )

  const navigateToCallsStatus: SessionRequestHandlerDeps['navigateToCallsStatus'] = useCallback((chainId, id) => {
    router.push({ pathname: '/pending-transactions', params: { chainId, txId: id } })
  }, [])

  const deps: SessionRequestHandlerDeps = useMemo(
    () => ({
      activeChain: activeChain ?? null,
      activeSafe: safe ?? null,
      hasSigner: !!activeSigner,
      switchActiveChainByCaip2,
      getCallsStatus,
      navigateToCallsStatus,
    }),
    [activeChain, safe, activeSigner, switchActiveChainByCaip2, getCallsStatus, navigateToCallsStatus],
  )

  useSessionProposalHandler(walletKit)
  useSessionRequestHandler(walletKit, deps)
  useSessionDeleteHandler(walletKit)
  useActiveSafeBinding(walletKit)

  return (
    <>
      {children}
      <RequestSheetHost walletKit={walletKit} />
    </>
  )
}
