import { render, screen, fireEvent } from '@/tests/test-utils'
import StarterUpsellBanner from '../StarterUpsellBanner'

describe('StarterUpsellBanner', () => {
  it('renders the upsell heading and CTA', () => {
    render(<StarterUpsellBanner />)

    expect(screen.getByText('Get flat pricing')).toBeInTheDocument()
    expect(screen.getByTestId('billing-upsell-upgrade')).toHaveTextContent('Explore plans')
  })

  it('calls onUpgrade when the CTA is clicked', () => {
    const onUpgrade = jest.fn()
    render(<StarterUpsellBanner onUpgrade={onUpgrade} />)

    fireEvent.click(screen.getByTestId('billing-upsell-upgrade'))
    expect(onUpgrade).toHaveBeenCalled()
  })
})
