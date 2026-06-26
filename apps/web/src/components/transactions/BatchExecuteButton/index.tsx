import { useCallback, useContext, useMemo, useState } from 'react'
import { Button, DialogActions, DialogContent, SvgIcon, Tooltip, Typography } from '@mui/material'
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
import { isGtfSafePaid } from '@/features/gtf/utils/isGtfSafePaid'
import ModalDialog from '@/components/common/ModalDialog'
import WarningIcon from '@/public/images/notifications/warning.svg'

const ALL_SAFE_PAID_TOOLTIP =
  "Bulk execution is not available when all ready transactions pay fees from the Safe. You'd pay gas twice, once from the Safe and once from your signer wallet."

const NOT_BATCHABLE_TOOLTIP =
  'Batch execution is only available for transactions that have been fully signed and are strictly sequential in Safe account nonce.'

const BATCHABLE_TOOLTIP = 'All highlighted transactions will be included in the batch execution.'

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

  const tooltipTitle = allSafePaid ? ALL_SAFE_PAID_TOOLTIP : isDisabled ? NOT_BATCHABLE_TOOLTIP : BATCHABLE_TOOLTIP

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
    <>
      <Tooltip placement="top-start" arrow title={tooltipTitle}>
        <span>
          <Button
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
            variant="contained"
            size="small"
            disabled={isDisabled}
            onClick={handleOpenModal}
          >
            Bulk execute{isBatchable && ` ${batchableTransactions.length} transactions`}
          </Button>
        </span>
      </Tooltip>

      {showMixedWarning && (
        <ModalDialog
          open
          onClose={() => setShowMixedWarning(false)}
          dialogTitle={
            <>
              <SvgIcon component={WarningIcon} inheritViewBox sx={{ mr: 1 }} />
              Some transactions will be charged gas twice
            </>
          }
          hideChainIndicator
          maxWidth="xs"
        >
          <DialogContent sx={{ p: '24px !important' }}>
            <Typography variant="body2">
              {safePaidCount} {safePaidCount === 1 ? 'transaction' : 'transactions'} in this batch{' '}
              {safePaidCount === 1 ? 'pays' : 'pay'} gas fees from the Safe. Those fees will still be deducted from the
              Safe, and your signer wallet will also pay gas to execute the batch. You&apos;ll pay gas twice on those
              transactions.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'space-between', '&::after': { display: 'none' } }}>
            <Button size="small" sx={{ height: 36 }} disableElevation onClick={() => setShowMixedWarning(false)}>
              Cancel
            </Button>
            <Button variant="contained" size="small" sx={{ height: 36 }} disableElevation onClick={handleConfirmMixed}>
              Execute anyway
            </Button>
          </DialogActions>
        </ModalDialog>
      )}
    </>
  )
}

export default BatchExecuteButton
