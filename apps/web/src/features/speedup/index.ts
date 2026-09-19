import { createFeatureHandle } from '@/features/__core__'
import type { SpeedupContract } from './contract'

export const SpeedupFeature = createFeatureHandle<SpeedupContract>('speedup')

export type { SpeedupContract } from './contract'
