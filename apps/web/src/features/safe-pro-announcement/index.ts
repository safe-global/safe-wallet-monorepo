import { createFeatureHandle } from '@/features/__core__'
import type { SafeProContract } from './contract'

export const SafeProFeature = createFeatureHandle<SafeProContract>('safe-pro-announcement')

export type { SafeProContract } from './contract'

export { useIsSafeProEnabled } from './hooks/useIsSafeProEnabled'
export { useSafeProAnnouncement, useSafeProTrialPrompt } from './hooks/useSafeProAnnouncement'
export { TRIAL_DISCLAIMER } from './constants'
