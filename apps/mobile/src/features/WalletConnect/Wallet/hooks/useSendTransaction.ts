import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { skipToken } from '@reduxjs/toolkit/query'
import { useToastController } from '@tamagui/toast'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import { getSdkError } from '@walletconnect/utils'
import type { IWalletKit } from '@reown/walletkit'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { composeSafeTxDraft, type DappCall } from '../services/composeSafeTxDraft'
import { removePending, setOutstandingRequest, type PendingSessionRequest } from '../store/walletKitSlice'
import { logWalletKitError } from '../utils/errors'

// pending.method is the narrowed DeferredTxMethod, so this is total — no throw needed.
const extractCalls = (method: PendingSessionRequest['method'], params: unknown): DappCall[] => {
  if (method === 'eth_sendTransaction') {
    const [tx] = params as [DappCall]
    return [tx]
  }
  // wallet_sendCalls
  const [batch] = params as [{ calls: DappCall[] }]
  return batch.calls
}

/**
 * Review / Reject actions for a transaction-request sheet, consumed by RequestSheetHost's
 * pinned footer. Review composes a draft on tap (one CGW /preview), then hands off to the
 * confirm-transaction flow — the dApp is answered later by the propose-success listener, not
 * here. A /preview failure surfaces a toast and stays on the sheet with no draft (compose
 * throws before setDraft). Reject answers the dApp with USER_REJECTED.
 */
export const useSendTransaction = (walletKit: IWalletKit | null, pending: PendingSessionRequest | null) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const toast = useToastController()
  const activeSafe = useAppSelector(selectActiveSafe)
  const chain = useAppSelector((s) => (activeSafe ? (selectChainById(s, activeSafe.chainId) ?? null) : null))
  // Only subscribe while a request sheet is up — the host is mounted at the app root.
  const { data: safe } = useSafesGetSafeV1Query(
    pending && activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
  )
  const safeSDK = useSafeSDK()
  const [composing, setComposing] = useState(false)

  // Review can only compose once the Safe state, chain config and protocol-kit SDK are ready.
  const ready = !!(activeSafe && safe && chain && safeSDK)

  const reject = useCallback(async () => {
    if (!walletKit || !pending) {
      return
    }
    // Swallow stale-topic errors (typical after a Metro reload — the relayer may have dropped
    // the topic locally; the dApp will eventually time out client-side).
    try {
      await walletKit.respondSessionRequest({
        topic: pending.topic,
        response: formatJsonRpcError(pending.id, getSdkError('USER_REJECTED').message),
      })
    } catch (e) {
      logWalletKitError('respondSessionRequest (reject) failed', e)
    }
    dispatch(removePending({ id: pending.id, kind: 'request' }))
  }, [walletKit, pending, dispatch])

  const review = useCallback(async () => {
    if (!walletKit || !pending || !activeSafe || !safe || !chain) {
      return
    }
    setComposing(true)
    try {
      const calls = extractCalls(pending.method, pending.params)
      const safeTxHash = await composeSafeTxDraft({
        calls,
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        safe,
        chain,
        dispatch,
      })
      // Hand off to the confirm-transaction flow. The dApp response is sent later by the
      // propose-success listener in WalletKitProvider, NOT here — the user hasn't signed yet.
      dispatch(setOutstandingRequest({ safeTxHash, topic: pending.topic, id: pending.id, method: pending.method }))
      dispatch(removePending({ id: pending.id, kind: 'request' }))
      router.push({ pathname: '/confirm-transaction', params: { txId: safeTxHash } })
    } catch (e) {
      // composeSafeTxDraft throws before setDraft on a /preview failure, so there is no draft
      // to clean up; stay on the sheet so the user can retry or reject.
      logWalletKitError('composeSafeTxDraft failed', e)
      toast.show('Failed to build transaction', { native: false, duration: 3000, variant: 'error' })
    } finally {
      setComposing(false)
    }
  }, [walletKit, pending, activeSafe, safe, chain, dispatch, router, toast])

  return { review, reject, composing, ready }
}
