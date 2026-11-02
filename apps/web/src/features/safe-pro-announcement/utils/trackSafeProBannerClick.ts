import { trackMixpanelEvent } from '@/services/analytics'
import { MixpanelEvent, MixpanelEventParams } from '@/services/analytics/mixpanel-events'

export type SafeProBannerLocation =
  'sidebar' | 'workspaces_list' | 'workspaces_sign_in' | 'my_accounts' | 'announcement_modal' | 'plans_page'

export const trackSafeProBannerClick = (location: SafeProBannerLocation, destinationUrl: string) =>
  trackMixpanelEvent(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, {
    [MixpanelEventParams.LOCATION]: location,
    [MixpanelEventParams.DESTINATION_URL]: destinationUrl,
  })
