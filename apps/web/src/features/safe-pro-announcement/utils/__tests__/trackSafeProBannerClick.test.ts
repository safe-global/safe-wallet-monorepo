import { MixpanelEvent, MixpanelEventParams, trackMixpanelEvent } from '@/services/analytics'
import { trackSafeProBannerClick } from '../trackSafeProBannerClick'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackMixpanelEvent: jest.fn(),
}))

describe('trackSafeProBannerClick', () => {
  it('sends the banner location as the Mixpanel Location property', () => {
    trackSafeProBannerClick('sidebar')

    expect(trackMixpanelEvent).toHaveBeenCalledWith(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, {
      [MixpanelEventParams.LOCATION]: 'sidebar',
    })
  })
})
