import { MixpanelEvent, MixpanelEventParams, trackMixpanelEvent } from '@/services/analytics'
import { SAFE_PRO_ANNOUNCEMENT_URL, SAFE_PRO_INTRO_URL } from '@/config/constants'
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
      [MixpanelEventParams.DESTINATION_URL]: SAFE_PRO_ANNOUNCEMENT_URL,
    })
  })

  it('sends the destination the banner links to when one is given', () => {
    trackSafeProBannerClick('my_accounts', SAFE_PRO_INTRO_URL)

    expect(trackMixpanelEvent).toHaveBeenCalledWith(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, {
      [MixpanelEventParams.LOCATION]: 'my_accounts',
      [MixpanelEventParams.DESTINATION_URL]: SAFE_PRO_INTRO_URL,
    })
  })
})
