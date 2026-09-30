import type { TransactionData, MultiSend } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type SyntheticEvent, useMemo, useCallback } from 'react'
import { ListItem } from '@/components/ui/list'
import { Skeleton } from '@/components/ui/skeleton'
import css from './styles.module.css'

import { type DraftBatchItem } from '../../store/batchSlice'
import DeleteIcon from '@/public/images/common/delete.svg'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import { Operation } from '@safe-global/store/gateway/types'

type BatchTxItemProps = DraftBatchItem & {
  id: string
  count: number
  onDelete?: (id: string) => void
  txDecoded?: MultiSend
  addressInfoIndex: TransactionData['addressInfoIndex']
  tokenInfoIndex: NonNullable<TransactionData['tokenInfoIndex']>
}

const BatchTxItem = ({
  id,
  count,
  txData,
  txDecoded,
  onDelete,
  addressInfoIndex,
  tokenInfoIndex,
}: BatchTxItemProps) => {
  const transactionDetails: TransactionData = useMemo(
    () => ({
      operation: Operation.CALL,
      to: { value: txData.to },
      value: txData.value,
      hexData: txData.data,
      trustedDelegateCallTarget: false,
      dataDecoded: txDecoded?.dataDecoded,
      addressInfoIndex,
      tokenInfoIndex,
    }),
    [addressInfoIndex, tokenInfoIndex, txData.data, txData.to, txData.value, txDecoded?.dataDecoded],
  )

  const handleDelete = useCallback(
    (e: SyntheticEvent) => {
      e.stopPropagation()
      if (confirm('Are you sure you want to delete this transaction?')) {
        onDelete?.(id)
        trackEvent(BATCH_EVENTS.BATCH_DELETE_TX)
      }
    },
    [onDelete, id],
  )

  return (
    <ListItem className="items-start gap-4 py-0">
      <div className={css.number}>{count}</div>
      {txDecoded ? (
        <div className={css.accordion}>
          <SingleTxDecoded
            actionTitle=""
            tx={txDecoded}
            txData={transactionDetails}
            actions={
              onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete transaction"
                  className="inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0.5"
                >
                  <DeleteIcon className="size-4" />
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <Skeleton className="h-[56px] w-full" />
      )}
    </ListItem>
  )
}

export default BatchTxItem
