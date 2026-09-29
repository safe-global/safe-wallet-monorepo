import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import PolicyUpsellBanner from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('PolicyUpsellBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should, when Upgrade to Business is clicked, track the click and call onUpgrade', async () => {
    const onUpgrade = jest.fn()
    const { user } = renderWithUserEvent(
      <PolicyUpsellBanner planName="Starter" workspaceName="Acme Inc" onUpgrade={onUpgrade} />,
    )

    await user.click(screen.getByRole('button', { name: /Upgrade to Business/ }))

    expect(mockTrackEvent).toHaveBeenCalledWith(POLICY_EVENTS.POLICY_UPSELL_UPGRADE_CLICKED)
    expect(onUpgrade).toHaveBeenCalledTimes(1)
  })
})
