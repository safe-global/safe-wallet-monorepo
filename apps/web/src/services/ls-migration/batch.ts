import { type BatchTxsState } from '@/store/batchSlice'
import { OperationType } from '@safe-global/types-kit'

export const migrateBatchTxs = (batchSliceState: BatchTxsState) => {
  // Iterate over all batches and migrate txDetails to txData
  Object.keys(batchSliceState).forEach((chainId) => {
    if (!batchSliceState[chainId]) return
    Object.keys(batchSliceState[chainId]).forEach((safeAddress) => {
      const batchState = batchSliceState[chainId][safeAddress]

      // Migrate old array format to new SafeBatchState format
      if (Array.isArray(batchState)) {
        batchSliceState[chainId][safeAddress] = {
          items: batchState,
          isConfirming: false,
        }
      }

      // Migrate txDetails to txData in items
      const items = batchSliceState[chainId][safeAddress].items
      if (items && Array.isArray(items)) {
        items.forEach((batch) => {
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
      }
    })
  })

  return batchSliceState
}
