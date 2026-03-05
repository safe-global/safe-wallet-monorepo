import type { FeatureHandle } from '@/features/__core__'
import type { BatchingContract } from './contract'

// Batching is a core feature — always enabled, not gated by a CGW feature flag.
// We still use the feature architecture for lazy loading and code organization.
export const BatchingFeature: FeatureHandle<BatchingContract> = {
  name: 'batching',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: BatchingContract }>,
}

export { useDraftBatch, useUpdateBatch } from './hooks/useDraftBatch'

export { batchSlice, addTx, removeTx, selectBatchBySafe } from './store/batchSlice'
export type { DraftBatchItem, CallOnlyTxData, BatchTxsState } from './store/batchSlice'
