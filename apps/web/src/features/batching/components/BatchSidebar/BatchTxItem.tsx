import type { TransactionData, MultiSend } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { type SyntheticEvent, useMemo, useCallback } from 'react'

import { type DraftBatchItem } from '../../store/batchSlice'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import { Operation } from '@safe-global/store/gateway/types'
import { BatchTxItemView } from '@views/features/batching/components/BatchSidebar/BatchTxItemView'

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
    <BatchTxItemView
      count={count}
      isDecoded={!!txDecoded}
      canDelete={!!onDelete}
      onDelete={handleDelete}
      renderDecoded={({ actionTitle, actions }) =>
        txDecoded ? (
          <SingleTxDecoded actionTitle={actionTitle} tx={txDecoded} txData={transactionDetails} actions={actions} />
        ) : null
      }
    />
  )
}

export default BatchTxItem
