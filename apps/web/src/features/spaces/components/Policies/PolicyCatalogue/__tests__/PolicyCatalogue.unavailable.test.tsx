import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PolicyCatalogue from '../index'

// Every shipped catalogue entry is currently available, so the unavailable branch of
// PolicyCatalogue's click handler is exercised against a fixture rather than the real
// catalogue — that keeps this coverage independent of which policies happen to be live.
jest.mock('../catalogue', () => ({
  POLICY_CATALOGUE: [
    {
      id: 'spending-limit',
      title: 'Shipped policy',
      description: 'A policy that has shipped.',
      Icon: jest.requireActual('lucide-react').WalletCards,
      isAvailable: true,
    },
    {
      id: 'account-recovery',
      title: 'Unshipped policy',
      description: 'A policy that has not shipped yet.',
      Icon: jest.requireActual('lucide-react').WalletCards,
      isAvailable: false,
    },
  ],
}))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('PolicyCatalogue — unavailable tiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders a mechanism not yet shipped as unavailable rather than absent', () => {
    renderWithUserEvent(<PolicyCatalogue />)

    expect(screen.getByRole('button', { name: /Unshipped policy/ })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: /Shipped policy/ })).not.toHaveAttribute('aria-disabled')
  })

  it('tracks a click on an unavailable tile', async () => {
    const { user } = renderWithUserEvent(<PolicyCatalogue />)

    await user.click(screen.getByRole('button', { name: /Unshipped policy/ }))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: 'account-recovery' },
      {
        [MixpanelEventParams.POLICY_TYPE]: 'account-recovery',
        [MixpanelEventParams.IS_AVAILABLE]: false,
      },
    )
  })

  it('does not open a flow that has not shipped', async () => {
    const onSelect = jest.fn()
    const { user } = renderWithUserEvent(<PolicyCatalogue onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /Unshipped policy/ }))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
