import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { GA_TO_MIXPANEL_MAPPING } from '@/services/analytics/ga-mixpanel-mapping'
import { MixpanelEvent } from '@/services/analytics/mixpanel-events'
import { trackPlansV2Click } from '../trackPlansV2Click'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

describe('trackPlansV2Click', () => {
  it('sends the click to GA and Mixpanel with the button location', () => {
    trackPlansV2Click('discuss_add_on')

    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.SAFE_PRO_PLANS_CLICKED, label: 'discuss_add_on' },
      { [MixpanelEventParams.LOCATION]: 'discuss_add_on' },
    )
  })

  it('maps to the Safe Pro Plans Clicked Mixpanel event', () => {
    expect(GA_TO_MIXPANEL_MAPPING[SPACE_EVENTS.SAFE_PRO_PLANS_CLICKED.action]).toBe(
      MixpanelEvent.SAFE_PRO_PLANS_CLICKED,
    )
  })
})
