import { useEffect, useRef } from 'react'
import { txSubscribe, TxEvent } from '@/services/tx/txEvents'
import { useDraftBatch, useUpdateBatch } from './useDraftBatch'
import { useLazyGetTransactionDetailsQuery } from '@/store/api/gateway'
import useChainId from './useChainId'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'

/**
 * Hook that automatically clears the draft batch when it's successfully proposed/signed
 *
 * This acts as a safety net for scenarios where the clearBatch callback doesn't execute:
 * - Window/tab closed before the API response returns
 * - Network interruption after the transaction is posted but before the response is received
 * - Error handling that prevents the callback from executing even though the tx succeeded
 *
 * The hook listens to TxEvent.PROPOSED and TxEvent.SIGNATURE_PROPOSED, which are dispatched
 * AFTER the backend confirms the transaction was successfully posted, making them more reliable
 * than the in-flow callback mechanism.
 *
 * When these events fire, the hook fetches the transaction details and compares the multisend
 * data with the current batch. If they match, it clears the batch.
 */
const useClearBatchOnSuccess = () => {
  const chainId = useChainId()
  const batchTxs = useDraftBatch()
  const [, deleteTx] = useUpdateBatch()
  const [trigger] = useLazyGetTransactionDetailsQuery()
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    // Only subscribe if there are batch items
    if (batchTxs.length === 0) {
      return
    }

    const checkAndClearBatch = async (txId: string) => {
      try {
        // Fetch the transaction details
        const { data: txDetails } = await trigger({ chainId, txId })

        if (!txDetails?.txData?.hexData) {
          return
        }

        const hexData = txDetails.txData.hexData

        // Check if this is a multisend transaction
        if (!isMultiSendCalldata(hexData)) {
          return
        }

        // Decode the multisend data
        const proposedTxs = decodeMultiSendData(hexData)

        // Compare with the current batch
        if (proposedTxs.length !== batchTxs.length) {
          return
        }

        const allMatch = batchTxs.every((batchItem, index) => {
          const proposedTx = proposedTxs[index]
          return (
            batchItem.txData.to.toLowerCase() === proposedTx.to.toLowerCase() &&
            batchItem.txData.value === proposedTx.value &&
            batchItem.txData.data === proposedTx.data &&
            batchItem.txData.operation === proposedTx.operation
          )
        })

        if (allMatch) {
          // Add a small delay to avoid race conditions with the regular callback
          clearTimeoutRef.current = setTimeout(() => {
            batchTxs.forEach((item) => deleteTx(item.id))
          }, 100)
        }
      } catch (error) {
        // Silently fail - this is a safety net, not critical functionality
        console.error('Error checking batch match on transaction event:', error)
      }
    }

    // Listen for transactions being successfully proposed
    const unsubscribeProposed = txSubscribe(TxEvent.PROPOSED, (detail) => {
      if (detail.txId) {
        checkAndClearBatch(detail.txId)
      }
    })

    // Listen for signature proposals
    const unsubscribeSignature = txSubscribe(TxEvent.SIGNATURE_PROPOSED, (detail) => {
      if (detail.txId) {
        checkAndClearBatch(detail.txId)
      }
    })

    return () => {
      unsubscribeProposed()
      unsubscribeSignature()
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
      }
    }
  }, [batchTxs, deleteTx, trigger, chainId])
}

export default useClearBatchOnSuccess
