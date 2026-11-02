import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { GTFContract } from './contract'

export const GTFFeature = createFeatureHandle<GTFContract>('gtf', FEATURES.GTF)
