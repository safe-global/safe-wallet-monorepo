import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SpendingLimitsContract } from './contract'

export const SpendingLimitsFeature = createFeatureHandle<SpendingLimitsContract>(
  'spending-limits',
  FEATURES.SPENDING_LIMIT,
)
