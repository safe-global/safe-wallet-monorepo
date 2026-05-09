import { useAppDispatch, useAppSelector } from '@/store'
import {
  clearPendingTx,
  setPendingTx,
  selectPendingTxs,
  PendingStatus,
  PendingTxType,
  type PendingProcessingTx,
} from '@/store/pendingTxsSlice'
import { useEffect, useMemo, useRef } from 'react'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import useChainId from './useChainId'
import { waitForRelayedTx, waitForTx } from '@/services/tx/txMonitor'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useTxHistory from './useTxHistory'
import { isTransactionListItem } from '@/utils/transaction-guards'
import useSafeInfo from './useSafeInfo'
import { SimpleTxWatcher } from '@/utils/SimpleTxWatcher'

const FINAL_PENDING_STATUSES = [TxEvent.SIGNATURE_INDEXED, TxEvent.SUCCESS, TxEvent.REVERTED, TxEvent.FAILED]

export const useTxMonitor = (): void => {
  const chainId = useChainId()
  const pendingTxs = useAppSelector(selectPendingTxs)
  const pendingTxEntriesOnChain = Object.entries(pendingTxs).filter(([, pendingTx]) => pendingTx.chainId === chainId)
  const provider = useWeb3ReadOnly()

  // Prevent `waitForTx` from monitoring the same tx more than once
  const monitoredTxs = useRef<{ [txId: string]: boolean }>({})

  // Monitor pending transaction mining/validating progress
  useEffect(() => {
    if (!provider || !pendingTxEntriesOnChain) {
      return
    }

    for (const [txId, pendingTx] of pendingTxEntriesOnChain) {
      const isProcessing = pendingTx.status === PendingStatus.PROCESSING
      const isMonitored = monitoredTxs.current[txId]
      const isRelaying = pendingTx.status === PendingStatus.RELAYING

      if (!(isProcessing || isRelaying) || isMonitored) {
        continue
      }

      monitoredTxs.current[txId] = true

      if (isProcessing) {
        waitForTx(
          provider,
          [txId],
          pendingTx.txHash,
          pendingTx.safeAddress,
          pendingTx.signerAddress,
          pendingTx.signerNonce,
          pendingTx.nonce,
          chainId,
        )
        continue
      }

      if (isRelaying) {
        waitForRelayedTx(pendingTx.taskId, [txId], pendingTx.chainId, pendingTx.safeAddress, pendingTx.nonce)
      }
    }
    // `provider` is updated when switching chains, re-running this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTxEntriesOnChain.length, provider])
}

const useTxPendingStatuses = (): void => {
  const dispatch = useAppDispatch()
  const { safe, safeAddress } = useSafeInfo()
  const { chainId } = safe
  const txHistory = useTxHistory()
  const historicalTxs = useMemo(() => {
    return txHistory.page?.results?.filter(isTransactionListItem) || []
  }, [txHistory.page?.results])

  useTxMonitor()

  // Subscribe to pending statuses
  useEffect(() => {
    const unsubSignatureProposing = txSubscribe(TxEvent.SIGNATURE_PROPOSED, (detail) => {
      // All pending txns should have a txId
      const txId = 'txId' in detail && detail.txId
      const nonce = 'nonce' in detail ? detail.nonce : undefined

      if (!txId || nonce === undefined) return

      // If we have future issues with statuses, we should refactor `useTxPendingStatuses`
      // @see https://github.com/safe-global/safe-wallet-web/issues/1754
      const isIndexed = historicalTxs.some((tx) => tx.transaction.id === txId)
      if (isIndexed) {
        return
      }

      // Update pendingTx
      dispatch(
        setPendingTx({
          nonce,
          chainId: detail.chainId,
          safeAddress: detail.safeAddress,
          txId,
          signerAddress: detail.signerAddress,
          status: PendingStatus.SIGNING,
        }),
      )
    })

    const unsubProcessing = txSubscribe(TxEvent.PROCESSING, (detail) => {
      // All pending txns should have a txId
      const txId = 'txId' in detail && detail.txId
      const nonce = 'nonce' in detail ? detail.nonce : undefined

      if (!txId || nonce === undefined) return

      // If we have future issues with statuses, we should refactor `useTxPendingStatuses`
      // @see https://github.com/safe-global/safe-wallet-web/issues/1754
      const isIndexed = historicalTxs.some((tx) => tx.transaction.id === txId)
      if (isIndexed) {
        return
      }

      const pendingTx: PendingProcessingTx & { txId: string } =
        detail.txType === 'Custom'
          ? {
              nonce,
              chainId: detail.chainId,
              safeAddress: detail.safeAddress,
              txId,
              status: PendingStatus.PROCESSING,
              txHash: detail.txHash,
              signerAddress: detail.signerAddress,
              signerNonce: detail.signerNonce,
              submittedAt: Date.now(),
              txType: PendingTxType.CUSTOM_TX,
              data: detail.data,
              to: detail.to,
            }
          : {
              nonce,
              chainId: detail.chainId,
              safeAddress: detail.safeAddress,
              txId,
              status: PendingStatus.PROCESSING,
              txHash: detail.txHash,
              signerAddress: detail.signerAddress,
              signerNonce: detail.signerNonce,
              submittedAt: Date.now(),
              gasLimit: detail.gasLimit,
              txType: PendingTxType.SAFE_TX,
            }
      // Update pendingTx
      dispatch(setPendingTx(pendingTx))
    })
    const unsubExecuting = txSubscribe(TxEvent.EXECUTING, (detail) => {
      // All pending txns should have a txId
      const txId = 'txId' in detail && detail.txId
      const nonce = 'nonce' in detail ? detail.nonce : undefined

      if (!txId || nonce === undefined) return

      // If we have future issues with statuses, we should refactor `useTxPendingStatuses`
      // @see https://github.com/safe-global/safe-wallet-web/issues/1754
      const isIndexed = historicalTxs.some((tx) => tx.transaction.id === txId)
      if (isIndexed) {
        return
      }

      // Update pendingTx
      dispatch(
        setPendingTx({
          nonce,
          chainId: detail.chainId,
          safeAddress: detail.safeAddress,
          txId,
          status: PendingStatus.SUBMITTING,
        }),
      )
    })

    const unsubProcessed = txSubscribe(TxEvent.PROCESSED, (detail) => {
      // All pending txns should have a txId
      const txId = 'txId' in detail && detail.txId
      const nonce = 'nonce' in detail ? detail.nonce : undefined

      if (!txId || nonce === undefined) return

      // If we have future issues with statuses, we should refactor `useTxPendingStatuses`
      // @see https://github.com/safe-global/safe-wallet-web/issues/1754
      const isIndexed = historicalTxs.some((tx) => tx.transaction.id === txId)
      if (isIndexed) {
        return
      }

      // Update pendingTx
      dispatch(
        setPendingTx({
          nonce,
          chainId: detail.chainId,
          safeAddress: detail.safeAddress,
          txId,
          txHash: detail.txHash,
          status: PendingStatus.INDEXING,
        }),
      )
    })
    const unsubRelaying = txSubscribe(TxEvent.RELAYING, (detail) => {
      // All pending txns should have a txId
      const txId = 'txId' in detail && detail.txId
      const nonce = 'nonce' in detail ? detail.nonce : undefined

      if (!txId || nonce === undefined) return

      // If we have future issues with statuses, we should refactor `useTxPendingStatuses`
      // @see https://github.com/safe-global/safe-wallet-web/issues/1754
      const isIndexed = historicalTxs.some((tx) => tx.transaction.id === txId)
      if (isIndexed) {
        return
      }

      // Update pendingTx
      dispatch(
        setPendingTx({
          nonce,
          chainId: detail.chainId,
          safeAddress: detail.safeAddress,
          txId,
          status: PendingStatus.RELAYING,
          taskId: detail.taskId,
        }),
      )
    })

    const unsubNestedTx = txSubscribe(TxEvent.NESTED_SAFE_TX_CREATED, (detail) => {
      const txId = detail.txId
      const nonce = detail.nonce

      if (!txId || nonce === undefined) return

      // If we have future issues with statuses, we should refactor `useTxPendingStatuses`
      // @see https://github.com/safe-global/safe-wallet-web/issues/1754
      const isIndexed = historicalTxs.some((tx) => tx.transaction.id === txId)
      if (isIndexed) {
        return
      }

      dispatch(
        setPendingTx({
          nonce,
          chainId: detail.chainId,
          safeAddress: detail.safeAddress,
          txId,
          status: PendingStatus.NESTED_SIGNING,
          signerAddress: detail.parentSafeAddress,
          txHashOrParentSafeTxHash: detail.txHashOrParentSafeTxHash,
        }),
      )
    })

    // All final states stop the watcher and clear the pending state
    const unsubFns = FINAL_PENDING_STATUSES.map((event) =>
      txSubscribe(event, (detail) => {
        // All pending txns should have a txId
        const txId = 'txId' in detail && detail.txId
        if (!txId) return

        // Clear the pending status if the tx is no longer pending
        if ('txHash' in detail && detail.txHash) {
          SimpleTxWatcher.getInstance().stopWatchingTxHash(detail.txHash)
        }
        dispatch(clearPendingTx({ txId }))
        return
      }),
    )

    unsubFns.push(
      unsubProcessing,
      unsubSignatureProposing,
      unsubExecuting,
      unsubProcessed,
      unsubRelaying,
      unsubNestedTx,
    )

    return () => {
      unsubFns.forEach((unsub) => unsub())
    }
  }, [dispatch, chainId, safeAddress, historicalTxs])
}

export default useTxPendingStatuses
