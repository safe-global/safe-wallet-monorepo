import { createFeatureHandle } from '@/features/__core__'
import type { BatchingContract } from './contract'

export const BatchingFeature = createFeatureHandle<BatchingContract>('batching')

export { useDraftBatch, useUpdateBatch } from './hooks/useDraftBatch'

export { batchSlice, addTx, removeTx, selectBatchBySafe } from './store/batchSlice'
export type { DraftBatchItem, CallOnlyTxData, BatchTxsState } from './store/batchSlice'
