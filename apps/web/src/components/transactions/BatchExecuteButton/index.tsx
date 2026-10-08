import { useCallback, useContext, useMemo, useState } from 'react'
import DialogActions from '@/components/common/DialogActions'
import { BatchExecuteHoverContext } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { useAppSelector } from '@/store'
import { selectPendingTxs } from '@/store/pendingTxsSlice'
import useBatchedTxs from '@/hooks/useBatchedTxs'
import { ExecuteBatchFlow } from '@/components/tx-flow/flows'
import { trackEvent } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import useWallet from '@/hooks/wallets/useWallet'
import useTxQueue from '@/hooks/useTxQueue'
import { TxModalContext } from '@/components/tx-flow'
import useChainId from '@/hooks/useChainId'
import { useTransactionsGetMultipleTransactionDetailsQuery } from '@safe-global/store/gateway/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { BatchExecuteButtonView } from '@views/components/transactions/BatchExecuteButton/BatchExecuteButtonView'

const BatchExecuteButton = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const pendingTxs = useAppSelector(selectPendingTxs)
  const hoverContext = useContext(BatchExecuteHoverContext)
  const { page } = useTxQueue()
  const batchableTransactions = useBatchedTxs(page?.results || [])
  const wallet = useWallet()
  const chainId = useChainId()
  const [showMixedWarning, setShowMixedWarning] = useState(false)

  const isBatchable = batchableTransactions.length > 1
  const hasPendingTx = batchableTransactions.some((tx) => pendingTxs[tx.transaction.id])

  // Pre-fetch details so we can detect Safe-pays txs upfront (drives the disable / warn UX).
  // RTK Query caches this — the modal reuses the same data when opened.
  const { data: txsWithDetails } = useTransactionsGetMultipleTransactionDetailsQuery(
    { chainId, txIds: batchableTransactions.map((tx) => tx.transaction.id) },
    { skip: !isBatchable || !chainId },
  )

  const safePaidCount = useMemo(() => {
    if (!txsWithDetails) return 0
    return txsWithDetails.filter((tx) => {
      const exec = isMultisigDetailedExecutionInfo(tx.detailedExecutionInfo) ? tx.detailedExecutionInfo : null
      return (
        exec &&
        isGtfSafePaid({
          gasPrice: exec.gasPrice,
          baseGas: exec.baseGas,
          refundReceiver: exec.refundReceiver?.value,
        })
      )
    }).length
  }, [txsWithDetails])

  const allSafePaid =
    isBatchable && !!txsWithDetails && safePaidCount > 0 && safePaidCount === batchableTransactions.length
  const isMixed = isBatchable && safePaidCount > 0 && safePaidCount < batchableTransactions.length

  // Until details load we can't tell all-Safe-paid / mixed apart — keep the button disabled so a
  // fast click can't bypass the all-Safe-paid disable or the mixed-batch warning modal.
  const detailsLoading = isBatchable && !!chainId && txsWithDetails === undefined

  const isDisabled = !isBatchable || hasPendingTx || !wallet || allSafePaid || detailsLoading

  const handleOnMouseEnter = useCallback(() => {
    hoverContext.setActiveHover(batchableTransactions.map((tx) => tx.transaction.id))
  }, [batchableTransactions, hoverContext])

  const handleOnMouseLeave = useCallback(() => {
    hoverContext.setActiveHover([])
  }, [hoverContext])

  const openBulkFlow = useCallback(() => {
    trackEvent({
      ...TX_LIST_EVENTS.BATCH_EXECUTE,
      label: batchableTransactions.length,
    })

    setTxFlow(<ExecuteBatchFlow txs={batchableTransactions} />, undefined, false)
  }, [batchableTransactions, setTxFlow])

  const handleOpenModal = () => {
    if (isMixed) {
      setShowMixedWarning(true)
      return
    }
    openBulkFlow()
  }

  const handleConfirmMixed = () => {
    setShowMixedWarning(false)
    openBulkFlow()
  }

  return (
    <BatchExecuteButtonView
      isBatchable={isBatchable}
      batchCount={batchableTransactions.length}
      isDisabled={isDisabled}
      allSafePaid={allSafePaid}
      onMouseEnter={handleOnMouseEnter}
      onMouseLeave={handleOnMouseLeave}
      onClick={handleOpenModal}
      showMixedWarning={showMixedWarning}
      safePaidCount={safePaidCount}
      onCloseMixedWarning={() => setShowMixedWarning(false)}
      renderDialogActions={(props) => (
        <DialogActions {...props} onCancel={() => setShowMixedWarning(false)} onConfirm={handleConfirmMixed} />
      )}
    />
  )
}

export default BatchExecuteButton
