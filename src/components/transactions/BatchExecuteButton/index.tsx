import { useCallback, useContext, useMemo } from 'react'
import { Button } from '@mui/material'
import css from './styles.module.css'
import { BatchExecuteHoverContext } from '@/components/transactions/BatchExecuteButton/BatchExecuteHoverProvider'
import { Transaction, TransactionListItem } from '@gnosis.pm/safe-react-gateway-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo, isTransactionListItem } from '@/utils/transaction-guards'
import { useAppSelector } from '@/store'
import { selectPendingTxs } from '@/store/pendingTxsSlice'
import CustomTooltip from '@/components/common/CustomTooltip'

const BATCH_LIMIT = 10

export const getBatchableTransactions = (items: (TransactionListItem | Transaction[])[], nonce: number) => {
  const batchableTransactions: Transaction[] = []
  let currentNonce = nonce

  const grouped = items
    .map((item) => {
      if (Array.isArray(item)) return item
      if (isTransactionListItem(item)) return [item]
    })
    .filter(Boolean) as Transaction[][]

  grouped.forEach((txs) => {
    const sorted = txs.slice().sort((a, b) => b.transaction.timestamp - a.transaction.timestamp)
    sorted.forEach((tx) => {
      if (!isMultisigExecutionInfo(tx.transaction.executionInfo)) return

      const { nonce, confirmationsSubmitted, confirmationsRequired } = tx.transaction.executionInfo
      if (
        batchableTransactions.length < BATCH_LIMIT &&
        nonce === currentNonce &&
        confirmationsSubmitted >= confirmationsRequired
      ) {
        batchableTransactions.push(tx)
        currentNonce = nonce + 1
      }
    })
  })

  return batchableTransactions
}

const BatchExecuteButton = ({ items }: { items: (TransactionListItem | Transaction[])[] }) => {
  const pendingTxs = useAppSelector(selectPendingTxs)
  const hoverContext = useContext(BatchExecuteHoverContext)
  const { safe } = useSafeInfo()

  const currentNonce = safe.nonce

  const batchableTransactions = useMemo(() => getBatchableTransactions(items, currentNonce), [currentNonce, items])

  const isBatchable = batchableTransactions.length > 1
  const hasPendingTx = batchableTransactions.some((tx) => pendingTxs[tx.transaction.id])
  const isDisabled = !isBatchable || hasPendingTx

  const handleOnMouseEnter = useCallback(() => {
    hoverContext.setActiveHover(batchableTransactions.map((tx) => tx.transaction.id))
  }, [batchableTransactions, hoverContext])

  const handleOnMouseLeave = useCallback(() => {
    hoverContext.setActiveHover([])
  }, [hoverContext])

  return (
    <CustomTooltip
      placement="top-start"
      arrow
      title={
        isDisabled
          ? 'Batch execution is only available for transactions that have been fully signed and are strictly sequential in Safe nonce.'
          : 'All transactions highlighted in light green will be included in the batch execution.'
      }
    >
      <Button
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
        className={css.button}
        variant="contained"
        size="small"
        disabled={isDisabled}
      >
        Execute Batch {isBatchable && ` (${batchableTransactions.length})`}
      </Button>
    </CustomTooltip>
  )
}

export default BatchExecuteButton
