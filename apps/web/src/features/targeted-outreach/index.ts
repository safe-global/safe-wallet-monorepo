import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { TargetedOutreachContract } from './contract'

// Feature handle - uses semantic mapping
export const TargetedOutreachFeature = createFeatureHandle<TargetedOutreachContract>('targeted-outreach')
