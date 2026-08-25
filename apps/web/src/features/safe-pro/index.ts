import { createFeatureHandle } from '@/features/__core__'
import type { SafeProContract } from './contract'

export const SafeProFeature = createFeatureHandle<SafeProContract>('safe-pro')

export type { SafeProContract } from './contract'

export { useIsSafeProEnabled } from './hooks/useIsSafeProEnabled'
