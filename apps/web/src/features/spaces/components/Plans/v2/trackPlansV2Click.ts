import { MixpanelEvent, MixpanelEventParams, trackMixpanelEvent } from '@/services/analytics'

export type PlansV2ClickLocation =
  | 'compare_features'
  | 'talk_to_sales'
  | 'account_team'
  | 'request_updates'
  | 'discuss_add_on'

export const trackPlansV2Click = (location: PlansV2ClickLocation) =>
  trackMixpanelEvent(MixpanelEvent.SAFE_PRO_PLANS_CLICKED, { [MixpanelEventParams.LOCATION]: location })
