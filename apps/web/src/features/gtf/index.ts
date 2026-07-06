import { createFeatureHandle } from '@/features/__core__'
import { useIsUnlimitedRelay } from '@/hooks/useChains'
import type { GTFContract } from './contract'

export const GTFFeature = createFeatureHandle<GTFContract>('gtf', useIsUnlimitedRelay)

export type { GTFContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
export { useGtfFeePreview } from './hooks/useGtfFeePreview'
export { useIsGtfSlotVisible } from './hooks/useIsGtfSlotVisible'
export { useHistoryFeesBreakdown } from './hooks/useHistoryFeesBreakdown'
export { useResolvedGasToken } from './hooks/useResolvedGasToken'
export type { ResolvedGasTokenState, FeePreviewTx } from './hooks/useResolvedGasToken'
