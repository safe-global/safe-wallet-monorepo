import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { GTFContract } from './contract'

export const GTFFeature = createFeatureHandle<GTFContract>('gtf', FEATURES.GTF)

export type { GTFContract } from './contract'
export { useFeesPreview } from './hooks/useFeesPreview'
export { useIsGtfSlotVisible } from './hooks/useIsGtfSlotVisible'
