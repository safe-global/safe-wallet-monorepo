import { MixpanelEvent, MixpanelEventParams, trackMixpanelEvent } from '@/services/analytics'
import { trackPlansV2Click } from '../trackPlansV2Click'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackMixpanelEvent: jest.fn(),
}))

describe('trackPlansV2Click', () => {
  it('sends the button location as the Mixpanel Location property', () => {
    trackPlansV2Click('discuss_add_on')

    expect(trackMixpanelEvent).toHaveBeenCalledWith(MixpanelEvent.SAFE_PRO_PLANS_CLICKED, {
      [MixpanelEventParams.LOCATION]: 'discuss_add_on',
    })
  })
})
