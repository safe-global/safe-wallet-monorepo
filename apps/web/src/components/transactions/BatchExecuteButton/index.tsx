import { useCallback, useContext, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@safe-global/views/components/ui/alert-dialog'
import DialogActions from '@/components/common/DialogActions'
import { BatchExecuteHoverContext } from '@safe-global/views/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { useAppSelector } from '@/store'
import { selectPendingTxs } from '@/store/pendingTxsSlice'
import useBatchedTxs from '@/hooks/useBatchedTxs'
import { ExecuteBatchFlow } from '@/components/tx-flow/flows'
import { trackEvent } from '@/services/analytics'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import useWallet from '@/hooks/wallets/useWallet'
import useTxQueue from '@/hooks/useTxQueue'
import { TxModalContext } from '@/components/tx-flow'
import useBatchTxDetails, { type BatchTxDetailsStatus } from './useBatchTxDetails'

const ALL_SAFE_PAID_TOOLTIP =
  "Bulk execution is not available when all ready transactions pay fees from the Safe. You'd pay gas twice, once from the Safe and once from your signer wallet."

const NOT_BATCHABLE_TOOLTIP =
  'Batch execution is only available for transactions that have been fully signed and are strictly sequential in Safe account nonce.'

const BATCHABLE_TOOLTIP = 'All highlighted transactions will be included in the batch execution.'

const DETAILS_LOADING_TOOLTIP = 'Loading the details of the ready transactions.'

const DETAILS_ERROR_TOOLTIP = "Couldn't load the details of the ready transactions. Click to try again."

const getTooltip = ({
  isBatchable,
  detailsStatus,
  allSafePaid,
  isDisabled,
}: {
  isBatchable: boolean
  detailsStatus: BatchTxDetailsStatus
  allSafePaid: boolean
  isDisabled: boolean
}): string => {
  if (!isBatchable) return NOT_BATCHABLE_TOOLTIP
  if (detailsStatus === 'loading') return DETAILS_LOADING_TOOLTIP
  if (detailsStatus === 'error') return DETAILS_ERROR_TOOLTIP
  if (allSafePaid) return ALL_SAFE_PAID_TOOLTIP
  return isDisabled ? NOT_BATCHABLE_TOOLTIP : BATCHABLE_TOOLTIP
}

const BatchExecuteButton = () => {
  const { setTxFlow } = useContext(TxModalContext)
  const pendingTxs = useAppSelector(selectPendingTxs)
  const hoverContext = useContext(BatchExecuteHoverContext)
  const { page } = useTxQueue()
  const batchableTransactions = useBatchedTxs(page?.results || [])
  const wallet = useWallet()
  const [showMixedWarning, setShowMixedWarning] = useState(false)

  const isBatchable = batchableTransactions.length > 1
  const hasPendingTx = batchableTransactions.some((tx) => pendingTxs[tx.transaction.id])

  const {
    status: detailsStatus,
    safePaidCount,
    retry: retryDetails,
  } = useBatchTxDetails(batchableTransactions, { skip: !isBatchable })

  const allSafePaid = isBatchable && safePaidCount > 0 && safePaidCount === batchableTransactions.length
  const isMixed = isBatchable && safePaidCount > 0 && safePaidCount < batchableTransactions.length

  // A click before the details load could skip the all-Safe-paid block or the mixed-batch warning
  const isDetailsLoading = detailsStatus === 'loading'

  const isDisabled = !isBatchable || hasPendingTx || !wallet || allSafePaid || isDetailsLoading

  const tooltip = getTooltip({ isBatchable, detailsStatus, allSafePaid, isDisabled })

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

  const handleClick = () => {
    if (detailsStatus === 'error') {
      retryDetails()
      return
    }
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
      <Tooltip>
        <TooltipTrigger
          render={
            <span>
              <Button
                onMouseEnter={handleOnMouseEnter}
                onMouseLeave={handleOnMouseLeave}
                variant="outline"
                size="action"
                disabled={isDisabled}
                onClick={handleClick}
              >
                Bulk execute{isBatchable && ` ${batchableTransactions.length} transactions`}
              </Button>
            </span>
          }
        />
        <TooltipContent side="top" align="start">
          {tooltip}
        </TooltipContent>
      </Tooltip>

      {showMixedWarning && (
        <AlertDialog open onOpenChange={(open) => !open && setShowMixedWarning(false)}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <div className="flex items-center justify-center size-10 rounded-full bg-[var(--color-warning-main)]/10 text-[var(--color-warning-main)] shrink-0">
                <TriangleAlert className="size-5" />
              </div>
              <AlertDialogTitle>Some transactions will be charged gas twice</AlertDialogTitle>
              <AlertDialogDescription>
                {safePaidCount} {safePaidCount === 1 ? 'transaction' : 'transactions'} in this batch{' '}
                {safePaidCount === 1 ? 'pays' : 'pay'} gas fees from the Safe. Those fees will still be deducted from
                the Safe, and your signer wallet will also pay gas to execute the batch. You&apos;ll pay gas twice on
                those transactions.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <DialogActions
                onCancel={() => setShowMixedWarning(false)}
                confirmLabel="Execute anyway"
                onConfirm={handleConfirmMixed}
              />
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export default BatchExecuteButton
