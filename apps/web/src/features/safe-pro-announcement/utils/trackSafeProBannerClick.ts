import { MixpanelEvent, MixpanelEventParams, trackMixpanelEvent } from '@/services/analytics'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'

export type SafeProBannerLocation =
  | 'sidebar'
  | 'workspaces_list'
  | 'workspaces_sign_in'
  | 'my_accounts'
  | 'announcement_modal'
  | 'plans_page'

export const trackSafeProBannerClick = (location: SafeProBannerLocation) =>
  trackMixpanelEvent(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, {
    [MixpanelEventParams.LOCATION]: location,
    [MixpanelEventParams.DESTINATION_URL]: SAFE_PRO_ANNOUNCEMENT_URL,
  })
