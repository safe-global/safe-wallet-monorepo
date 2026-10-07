import { fireEvent, render, screen } from '@/tests/test-utils'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import SeatLimitBanner from '../SeatLimitBanner'

const mockUseSeatUpsell = jest.fn()
jest.mock('../../../hooks/useSeatUpsell', () => ({ useSeatUpsell: () => mockUseSeatUpsell() }))

describe('SeatLimitBanner', () => {
  it('sends a Business Workspace to sales and hides once acknowledged', () => {
    mockUseSeatUpsell.mockReturnValue({ tierName: 'Business', limit: 20, plansHref: '/spaces/plans?spaceId=1' })
    render(<SeatLimitBanner />)

    expect(screen.getByText('The Business plan includes 20 Safe accounts')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'talk to us about a higher limit.' })).toHaveAttribute(
      'href',
      CONTACT_SALES_URL,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByTestId('seat-limit-banner')).not.toBeInTheDocument()
  })

  it('links a Starter Workspace to the bigger plan on the page', () => {
    mockUseSeatUpsell.mockReturnValue({
      tierName: 'Starter',
      limit: 2,
      upgradePlanName: 'Business',
      plansHref: '/spaces/plans?spaceId=1',
    })
    render(<SeatLimitBanner />)

    expect(screen.getByRole('link', { name: 'upgrade to Business.' })).toHaveAttribute(
      'href',
      '/spaces/plans?spaceId=1',
    )
  })

  it('leads with a primary Talk to sales inside the chooser', () => {
    mockUseSeatUpsell.mockReturnValue({ tierName: 'Business', limit: 20, plansHref: '/spaces/plans?spaceId=1' })
    render(<SeatLimitBanner variant="alert" />)

    expect(screen.getByTestId('seat-limit-banner')).toHaveTextContent('The Business plan includes 20 Safe accounts')
    expect(screen.getByRole('link', { name: 'Talk to sales' })).toHaveAttribute('href', CONTACT_SALES_URL)
  })

  it('sends a Starter Workspace to the Plans page for the bigger plan, also as an alert', () => {
    mockUseSeatUpsell.mockReturnValue({
      tierName: 'Starter',
      limit: 2,
      upgradePlanName: 'Business',
      plansHref: '/spaces/plans?spaceId=1',
    })
    render(<SeatLimitBanner variant="alert" />)

    expect(screen.getByText('The Starter plan includes 2 Safe accounts')).toBeInTheDocument()
    expect(screen.getByText('Upgrade for more, or remove one to add another.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upgrade to Business' })).toHaveAttribute('href', '/spaces/plans?spaceId=1')
  })

  it('renders nothing without a seat limit', () => {
    mockUseSeatUpsell.mockReturnValue({ tierName: undefined, limit: null, plansHref: '/welcome/spaces' })
    expect(render(<SeatLimitBanner />).container).toBeEmptyDOMElement()
  })
})
