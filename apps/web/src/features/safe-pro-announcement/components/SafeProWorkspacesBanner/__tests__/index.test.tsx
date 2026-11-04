import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent, trackMixpanelEvent, MixpanelEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { SAFE_PRO_INTRO_URL } from '@/config/constants'
import SafeProWorkspacesBanner from '../index'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
  trackMixpanelEvent: jest.fn(),
}))

describe('SafeProWorkspacesBanner', () => {
  it('tracks viewed on mount and clicked, with the location it is given', () => {
    render(<SafeProWorkspacesBanner location="my_accounts" />)
    fireEvent.click(screen.getByRole('link', { name: 'Learn more' }))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { Location: 'my_accounts' })
    expect(trackMixpanelEvent).toHaveBeenCalledWith(MixpanelEvent.SAFE_PRO_BANNER_CLICKED, {
      Location: 'my_accounts',
      'Destination URL': SAFE_PRO_INTRO_URL,
    })
  })

  it('renders the headline and the supporting line', () => {
    render(<SafeProWorkspacesBanner />)

    expect(screen.getByText('Safe Pro: 30 days of Business free. No card.')).toBeInTheDocument()
    expect(screen.getByText('Your Safe accounts remain free in My accounts.')).toBeInTheDocument()
  })

  it('points the Learn more CTA at the Safe Pro intro post in a safe new tab', () => {
    render(<SafeProWorkspacesBanner />)

    const cta = screen.getByRole('link', { name: 'Learn more' })
    expect(cta).toHaveAttribute('href', 'https://safe.global/blog/introducing-safe-pro')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })
})
