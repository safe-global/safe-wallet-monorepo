import { createFeatureHandle } from '@/features/__core__'
import type { TargetedOutreachContract } from './contract'

// Feature handle - uses semantic mapping
export const TargetedOutreachFeature = createFeatureHandle<TargetedOutreachContract>('targeted-outreach')

// Contract type (for type annotations if needed)
export type { TargetedOutreachContract } from './contract'
