import { type BatchTxsState } from '@/store/batchSlice'
import { OperationType } from '@safe-global/types-kit'

export const migrateBatchTxs = (batchSliceState: BatchTxsState) => {
  // Iterate over all batches and migrate txDetails to txData
  Object.keys(batchSliceState).forEach((chainId) => {
    if (!batchSliceState[chainId]) return
    Object.keys(batchSliceState[chainId]).forEach((safeAddress) => {
      const batchState = batchSliceState[chainId][safeAddress]

      // Skip if batchState is invalid
      if (!batchState) return

      // Migrate old array format to new SafeBatchState format
      if (Array.isArray(batchState)) {
        batchSliceState[chainId][safeAddress] = {
          items: batchState,
          isConfirming: false,
        }
      }

      // Ensure we have a valid SafeBatchState object
      const safeBatchState = batchSliceState[chainId][safeAddress]
      if (typeof safeBatchState !== 'object' || !safeBatchState.items) {
        return
      }

      // Migrate txDetails to txData in items
      const items = safeBatchState.items
      if (Array.isArray(items)) {
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
