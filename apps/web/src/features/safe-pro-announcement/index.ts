import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { SafeProContract } from './contract'

export const SafeProFeature = createFeatureHandle<SafeProContract>('safe-pro-announcement')
