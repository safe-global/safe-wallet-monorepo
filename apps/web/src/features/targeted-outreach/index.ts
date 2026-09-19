import { createFeatureHandle } from '@/features/__core__'
import type { TargetedOutreachContract } from './contract'

export const TargetedOutreachFeature = createFeatureHandle<TargetedOutreachContract>('targeted-outreach')

export type { TargetedOutreachContract } from './contract'
