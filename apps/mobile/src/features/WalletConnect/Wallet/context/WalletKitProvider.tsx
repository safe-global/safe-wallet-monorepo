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
  isDeferredTxMethod,
} from '../store/walletKitSlice'
import { RequestSheetHost } from '../components/RequestSheetHost'
import { selectActiveSafe, switchActiveChain } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { proxyReadOnlyCall } from '../services/readRpcProxy'
import { SUPPORTED_NAMESPACE } from '../services/constants'
import { logWalletKitError } from '../utils/errors'
import type { TransactionReceipt } from 'ethers'

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
        // Only seed requests the UI can act on. Read-only methods that survived a
        // restart would hang in the slice with no sheet to render them.
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
        // The arg shape: { chainId, safeAddress, proposeTransactionDto: { safeTxHash, ... } }.
        // The DTO key is `proposeTransactionDto` per the generated endpoint
        // (packages/store/src/gateway/AUTO_GENERATED/transactions.ts); a previous typo
        // (`transactionV1Dto`) silently swallowed every propose, so dApps never received
        // the wallet_sendCalls / eth_sendTransaction response.
        const arg = action.meta.arg.originalArgs as {
          proposeTransactionDto?: { safeTxHash?: string }
        }
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
      // chainId arrives as CAIP-2 (e.g. 'eip155:11155111'); CGW + envelope want numeric/hex.
      const numericChainId = chainId.startsWith(`${SUPPORTED_NAMESPACE}:`)
        ? chainId.slice(SUPPORTED_NAMESPACE.length + 1)
        : chainId
      const chainIdHex = `0x${Number(numericChainId).toString(16)}` as `0x${string}`

      // Mirror apps/web/.../safe-wallet-provider/index.ts wallet_getCallsStatus: throw if
      // the tx isn't known (the JSON-RPC error layer in methodRouter converts to {code, message}).
      let tx
      try {
        tx = await dispatch(
          cgwApi.endpoints.transactionsGetTransactionByIdV1.initiate({ chainId: numericChainId, id }),
        ).unwrap()
      } catch {
        throw new Error('Transaction not found')
      }

      // BundleTxStatuses (verbatim from web):
      //   AWAITING_CONFIRMATIONS / AWAITING_EXECUTION → 100 PENDING
      //   SUCCESS                                     → 200 CONFIRMED
      //   CANCELLED                                   → 400 OFFCHAIN_FAILURE
      //   FAILED                                      → 500 REVERTED
      const status =
        tx.txStatus === 'SUCCESS' ? 200 : tx.txStatus === 'CANCELLED' ? 400 : tx.txStatus === 'FAILED' ? 500 : 100

      const envelope = {
        version: '2.0.0' as const,
        id,
        chainId: chainIdHex,
        status,
        atomic: true as const,
      }

      // No on-chain tx hash yet → no receipts (still a valid 100/400 response).
      if (!tx.txHash) {
        return envelope
      }

      const chain = selectChainById(store.getState(), numericChainId)
      if (!chain) {
        return envelope
      }

      let receipt: TransactionReceipt | null = null
      try {
        receipt = (await proxyReadOnlyCall(chain, 'eth_getTransactionReceipt', [
          tx.txHash,
        ])) as TransactionReceipt | null
      } catch {
        return envelope
      }
      if (!receipt) {
        return envelope
      }

      // Web replicates the same receipt for each underlying call in the bundle.
      let callsCount = 1
      const valueDecoded = tx.txData?.dataDecoded?.parameters?.[0]?.valueDecoded
      if (Array.isArray(valueDecoded) && valueDecoded.length > 0) {
        callsCount = valueDecoded.length
      }

      const blockNumber = Number(receipt.blockNumber)
      const gasUsed = Number(receipt.gasUsed)
      const onChainStatusHex = (tx.txStatus === 'SUCCESS' ? '0x1' : '0x0') as `0x${string}`

      return {
        ...envelope,
        receipts: Array.from({ length: callsCount }, () => ({
          logs: receipt.logs as unknown[],
          status: onChainStatusHex,
          blockHash: receipt.blockHash as `0x${string}`,
          blockNumber: `0x${blockNumber.toString(16)}` as `0x${string}`,
          gasUsed: `0x${gasUsed.toString(16)}` as `0x${string}`,
          transactionHash: tx.txHash as `0x${string}`,
        })),
      }
    },
    [dispatch, store],
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
