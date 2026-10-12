import { createFeatureHandle } from '@/features/__core__'
import type { SafeProContract } from './contract'

export const SafeProFeature = createFeatureHandle<SafeProContract>('safe-pro-announcement')

export type { SafeProContract } from './contract'

export { useIsSafeProAnnouncementEnabled } from './hooks/useIsSafeProAnnouncementEnabled'
export { useSafeProAnnouncementModal } from './hooks/useSafeProAnnouncementModal'
export { useSafeProSidebarBannerDismissed } from './hooks/useSafeProSidebarBannerDismissed'
