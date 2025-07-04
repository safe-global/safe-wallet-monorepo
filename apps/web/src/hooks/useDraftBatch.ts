import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import useChainId from './useChainId'
import useSafeAddress from './useSafeAddress'
import type { CallOnlyTxData, DraftBatchItem } from '@/store/batchSlice'
import { selectBatchBySafe, addTx, removeTx } from '@/store/batchSlice'
import { type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { shallowEqual } from 'react-redux'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { OperationType } from '@safe-global/types-kit'

export const useUpdateBatch = () => {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const dispatch = useAppDispatch()

  const onAdd = useCallback(
    async (txDetails: TransactionDetails): Promise<void> => {
      let txs: CallOnlyTxData[]
      // If it is a multisend, we decode the data to get the individual transactions
      if (txDetails.txData?.hexData && isMultiSendCalldata(txDetails.txData?.hexData)) {
        const decodedTxs = decodeMultiSendData(txDetails.txData?.hexData)
        txs = decodedTxs.map((tx) => ({
          to: tx.to,
          value: tx.value,
          data: tx.data,
          operation: OperationType.Call,
        }))
      } else {
        txs = txDetails.txData
          ? [
              {
                to: txDetails.txData.to.value,
                value: txDetails.txData.value ?? '0',
                operation: OperationType.Call,
                data: txDetails.txData.hexData ?? '0x',
              },
            ]
          : []
      }
      txs.forEach((tx) => {
        dispatch(
          addTx({
            chainId,
            safeAddress,
            txData: tx,
          }),
        )
      })

      if (isMultisigExecutionInfo(txDetails.detailedExecutionInfo)) {
        txDispatch(TxEvent.BATCH_ADD, { txId: txDetails.txId, nonce: txDetails.detailedExecutionInfo.nonce })
      }

      trackEvent({ ...BATCH_EVENTS.BATCH_TX_APPENDED, label: txDetails.txInfo.type })
    },
    [dispatch, chainId, safeAddress],
  )

  const onDelete = useCallback(
    (id: DraftBatchItem['id']) => {
      dispatch(
        removeTx({
          chainId,
          safeAddress,
          id,
        }),
      )
    },
    [dispatch, chainId, safeAddress],
  )

  return [onAdd, onDelete] as const
}

export const useDraftBatch = (): DraftBatchItem[] => {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const batch = useAppSelector((state) => selectBatchBySafe(state, chainId, safeAddress), shallowEqual)
  return batch
}
