import { createFeatureHandle } from '@/features/__core__'
import type { SpeedupContract } from './contract'

// Feature handle - uses semantic mapping
export const SpeedupFeature = createFeatureHandle<SpeedupContract>('speedup')

// Contract type (for type annotations if needed)
export type { SpeedupContract } from './contract'
