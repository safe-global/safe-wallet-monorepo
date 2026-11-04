import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent, trackMixpanelEvent, MixpanelEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { SAFE_PRO_INTRO_URL } from '@/config/constants'
import SafeProBanner from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
  trackMixpanelEvent: jest.fn(),
}))

describe('SafeProBanner', () => {
  it('tracks viewed on mount and clicked, with the location it is given', () => {
    render(<SafeProBanner location="my_accounts" />)
    fireEvent.click(screen.getByRole('link'))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { Location: 'my_accounts' })
    expect(trackMixpanelEvent).toHaveBeenCalledWith(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, {
      Location: 'my_accounts',
      'Destination URL': SAFE_PRO_INTRO_URL,
    })
  })

  it('renders the headline and the New tag', () => {
    render(<SafeProBanner />)

    expect(screen.getByText('Safe Pro: 30 days of Business free. No card.')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('makes the whole banner one link to the Safe Pro intro post in a safe new tab', () => {
    render(<SafeProBanner />)

    const cta = screen.getByRole('link', { name: /Safe Pro: 30 days of Business free\. No card\./ })
    expect(cta).toHaveAttribute('href', 'https://safe.global/blog/introducing-safe-pro')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
