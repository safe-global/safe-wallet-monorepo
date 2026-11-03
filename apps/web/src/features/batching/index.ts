import type { FeatureHandle } from '@/features/__core__/types'
import type { BatchingContract } from './contract'

// Batching is a core feature — always enabled, not gated by a CGW feature flag.
// We still use the feature architecture for lazy loading and code organization.
export const BatchingFeature: FeatureHandle<BatchingContract> = {
  name: 'batching',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: BatchingContract }>,
}

export { default as BatchTxList } from './components/BatchSidebar/BatchTxList'
export { default as BatchTooltip } from './components/BatchTooltip'
