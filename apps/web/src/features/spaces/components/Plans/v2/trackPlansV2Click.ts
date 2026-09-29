import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

export type PlansV2ClickLocation =
  | 'compare_features'
  | 'talk_to_sales'
  | 'account_team'
  | 'request_updates'
  | 'discuss_add_on'

export const trackPlansV2Click = (location: PlansV2ClickLocation) =>
  trackEvent({ ...SPACE_EVENTS.SAFE_PRO_PLANS_CLICKED, label: location }, { [MixpanelEventParams.LOCATION]: location })
