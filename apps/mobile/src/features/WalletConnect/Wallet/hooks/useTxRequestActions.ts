import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { skipToken } from '@reduxjs/toolkit/query'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { showToast } from '@/src/store/toastSlice'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectChainById } from '@/src/store/chains'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { composeSafeTxDraft, type DappCall } from '../services/composeSafeTxDraft'
import {
  removePending,
  rejectPending,
  setOutstandingRequest,
  type PendingSessionRequest,
} from '../store/walletKitSlice'
import { logWalletKitError } from '../utils/errors'

const extractCalls = (method: PendingSessionRequest['method'], params: unknown): DappCall[] => {
  if (method === 'eth_sendTransaction') {
    const [tx] = params as [DappCall]
    return [tx]
  }
  const [batch] = params as [{ calls: DappCall[] }] // wallet_sendCalls
  return batch.calls
}

/**
 * Review / Reject actions for the tx-request sheet footer. Review composes a draft and routes to
 * the confirm flow (the dApp is answered later by the propose-success listener); Reject just
 * dispatches rejectPending. Both responses are owned by the walletKit listener, not this hook.
 */
export const useTxRequestActions = (pending: PendingSessionRequest | null) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const activeSafe = useAppSelector(selectActiveSafe)
  const chain = useAppSelector((s) => (activeSafe ? (selectChainById(s, activeSafe.chainId) ?? null) : null))
  // Only query while a sheet is up — the host is mounted at the app root.
  const { data: safe } = useSafesGetSafeV1Query(
    pending && activeSafe ? { chainId: activeSafe.chainId, safeAddress: activeSafe.address } : skipToken,
  )
  const safeSDK = useSafeSDK()
  const [composing, setComposing] = useState(false)

  const ready = !!(activeSafe && safe && chain && safeSDK)

  const reject = useCallback(() => {
    if (!pending) {
      return
    }
    dispatch(rejectPending(pending))
  }, [pending, dispatch])

  const review = useCallback(async () => {
    if (!pending || !activeSafe || !safe || !chain) {
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
      // Hand off to the confirm flow; the dApp is answered later by the propose-success listener.
      dispatch(
        setOutstandingRequest({
          safeTxHash,
          topic: pending.topic,
          id: pending.id,
          method: pending.method,
          chainId: activeSafe.chainId,
          safeAddress: activeSafe.address,
        }),
      )
      dispatch(removePending({ id: pending.id, kind: 'request' }))
      router.push({ pathname: '/confirm-transaction', params: { txId: safeTxHash } })
    } catch (e) {
      // compose throws before setDraft, so there's nothing to clean up — stay on the sheet.
      logWalletKitError('composeSafeTxDraft failed', e)
      dispatch(showToast({ message: 'Failed to build transaction', duration: 3000, variant: 'error' }))
    } finally {
      setComposing(false)
    }
  }, [pending, activeSafe, safe, chain, dispatch, router])

  return { review, reject, composing, ready }
}
