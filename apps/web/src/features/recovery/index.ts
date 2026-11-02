import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { RecoveryContract } from './contract'

// Feature handle - uses semantic mapping
export const RecoveryFeature = createFeatureHandle<RecoveryContract>('recovery')
