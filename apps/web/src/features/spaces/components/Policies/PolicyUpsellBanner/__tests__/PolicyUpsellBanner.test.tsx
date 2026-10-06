import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
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

    const prompt = { Feature: 'policies', Location: 'policies_page' }
    expect(mockTrackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, prompt)
    expect(mockTrackEvent).toHaveBeenCalledWith(POLICY_EVENTS.POLICY_UPSELL_UPGRADE_CLICKED)
    expect(mockTrackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED, {
      'Entry Point': 'upgrade_prompt',
      ...prompt,
    })
    expect(onUpgrade).toHaveBeenCalledTimes(1)
  })
})
