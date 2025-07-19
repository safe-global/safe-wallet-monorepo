import { type BatchTxsState } from '@/store/batchSlice'
import { OperationType } from '@safe-global/types-kit'

export const migrateBatchTxs = (batchSliceState: BatchTxsState) => {
  // Iterate over all batches and migrate txDetails to txData
  Object.keys(batchSliceState).forEach((chainId) => {
    if (!batchSliceState[chainId]) return
    Object.keys(batchSliceState[chainId]).forEach((safeAddress) => {
      batchSliceState[chainId][safeAddress].forEach((batch) => {
        if (batch.txDetails && batch.txDetails.txData && !batch.txData) {
          batch.txData = {
            to: batch.txDetails.txData.to.value,
            value: batch.txDetails.txData.value ?? '0',
            data: batch.txDetails.txData.hexData ?? '0x',
            operation: OperationType.Call, // We only support calls
          }
          delete batch.txDetails
        }
      })
    })
  })

  return batchSliceState
}
