import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SpacesContract } from './contract'

// Feature handle - uses semantic mapping
export const SpacesFeature = createFeatureHandle<SpacesContract>('spaces')
