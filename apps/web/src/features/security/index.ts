import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SecurityContract } from './contract'

// Feature handle — gated on the dedicated Security Hub flag
export const SecurityFeature = createFeatureHandle<SecurityContract>('security', FEATURES.SECURITY_HUB)
