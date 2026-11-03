import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SpeedupContract } from './contract'

// Feature handle - uses semantic mapping
export const SpeedupFeature = createFeatureHandle<SpeedupContract>('speedup')
