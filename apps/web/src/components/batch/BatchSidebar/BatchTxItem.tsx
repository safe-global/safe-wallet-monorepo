import { type SyntheticEvent, useMemo, useCallback } from 'react'
import { ButtonBase, ListItem, Skeleton, SvgIcon } from '@mui/material'
import css from './styles.module.css'
import { type DraftBatchItem } from '@/store/batchSlice'

import DeleteIcon from '@/public/images/common/delete.svg'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import SingleTxDecoded from '@/components/transactions/TxDetails/TxData/DecodedData/SingleTxDecoded'
import {
  type AddressEx,
  Operation,
  type TransactionData,
  type InternalTransaction,
} from '@safe-global/safe-gateway-typescript-sdk'
import { type TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

type BatchTxItemProps = DraftBatchItem & {
  id: string
  count: number
  onDelete?: (id: string) => void
  txDecoded?: InternalTransaction
  addressInfoIndex: Record<string, AddressEx>
  tokenInfoIndex: Record<string, TokenInfo>
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
    <ListItem disablePadding sx={{ gap: 2, alignItems: 'flex-start' }}>
      <div className={css.number}>{count}</div>
      {txDecoded ? (
        <div className={css.accordion}>
          <SingleTxDecoded
            actionTitle=""
            tx={txDecoded}
            txData={transactionDetails}
            actions={
              onDelete ? (
                <ButtonBase onClick={handleDelete} title="Delete transaction" sx={{ p: 0.5 }}>
                  <SvgIcon component={DeleteIcon} inheritViewBox fontSize="small" />
                </ButtonBase>
              ) : undefined
            }
          />
        </div>
      ) : (
        <Skeleton width="100%" height="56px" />
      )}
    </ListItem>
  )
}

export default BatchTxItem
