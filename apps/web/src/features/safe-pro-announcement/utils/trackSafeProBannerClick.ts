import { MixpanelEvent, MixpanelEventParams, trackMixpanelEvent } from '@/services/analytics'

export type SafeProBannerLocation =
  | 'sidebar'
  | 'workspaces_list'
  | 'workspaces_sign_in'
  | 'announcement_modal'
  | 'plans_page'

export const trackSafeProBannerClick = (location: SafeProBannerLocation) =>
  trackMixpanelEvent(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, { [MixpanelEventParams.LOCATION]: location })
