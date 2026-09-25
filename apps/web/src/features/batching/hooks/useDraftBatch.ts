import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import type { CallOnlyTxData, DraftBatchItem } from '../store/batchSlice'
import { selectBatchBySafe, addTx, removeTx } from '../store/batchSlice'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { shallowEqual } from 'react-redux'
import { isMultiSendCalldata } from '@/utils/transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type SafeTransaction } from '@safe-global/types-kit'

const getCallOnlyTxs = (safeTx: SafeTransaction): CallOnlyTxData[] => {
  const { to, value, data } = safeTx.data

  if (isMultiSendCalldata(data)) {
    return decodeMultiSendData(data).map((tx) => ({ ...tx, operation: OperationType.Call }))
  }

  return [{ to, value, data, operation: OperationType.Call }]
}

export const useUpdateBatch = () => {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const dispatch = useAppDispatch()

  const onAdd = useCallback(
    async (safeTx: SafeTransaction): Promise<void> => {
      getCallOnlyTxs(safeTx).forEach((txData) => {
        dispatch(addTx({ chainId, safeAddress, txData }))
      })

      txDispatch(TxEvent.BATCH_ADD, { nonce: safeTx.data.nonce })

      trackEvent(BATCH_EVENTS.BATCH_TX_APPENDED)
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
