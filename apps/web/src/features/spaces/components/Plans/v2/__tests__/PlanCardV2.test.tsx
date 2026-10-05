import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '../../types'
import { PlanCardV2 } from '../PlanCardV2'

const businessPlan = (overrides: Partial<CurrentPlan> = {}): CurrentPlan => ({
  name: 'Business',
  price: 1669,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing: false,
  periodEndsAt: null,
  ...overrides,
})

const currentTier = (
  currentPriceId: string,
  options = [option(5, 66_900), option(10, 109_900), option(20, 166_900)],
) => ({
  ...BUSINESS,
  id: 'current',
  options,
  isCurrent: true,
  currentPriceId,
})

const option = (seats: number, cents: number): PlanSeatOption => ({
  paymentLinkId: `pl_b${seats}m`,
  priceId: `price_b${seats}m`,
  label: `${seats} Safe accounts`,
  seats,
  price: cents / 100,
  originalPrice: null,
})

const BUSINESS: PlanTier = {
  id: 'Business-month',
  name: 'Business',
  currency: 'eur',
  billingCycle: 'month',
  options: [option(20, 166_900), option(5, 66_900)],
  features: [],
}

describe('PlanCardV2', () => {
  it('opens on the plan in force even when it is not the first Safe count', () => {
    render(<PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan({ price: 1099 })} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('10 Safe accounts')
    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled()
  })
  it('follows a subscription that lands after the card mounted', () => {
    const { rerender } = render(<PlanCardV2 tier={{ ...currentTier(''), currentPriceId: undefined }} />)
    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('5 Safe accounts')

    rerender(<PlanCardV2 tier={currentTier('price_b20m')} currentPlan={businessPlan()} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })
  it('keeps a picked Safe count when the page rebuilds the tiers', async () => {
    const { user, rerender } = renderWithUserEvent(
      <PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan({ price: 1099 })} />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Safe accounts for Business' })
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await user.click(await screen.findByRole('option', { name: '20 Safe accounts' }))
    rerender(<PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan({ price: 1099 })} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })
  it('marks only the plan in force as current', () => {
    const { rerender } = render(<PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan()} />)
    expect(screen.getByTestId('plan-current-badge')).toHaveTextContent('Current')

    rerender(<PlanCardV2 tier={BUSINESS} />)

    expect(screen.queryByTestId('plan-current-badge')).not.toBeInTheDocument()
  })
  it('opens the other billing cycle on the Safe count of the plan in force', () => {
    const yearly: PlanTier = {
      ...BUSINESS,
      id: 'Business-year',
      billingCycle: 'year',
      options: [option(5, 719_000), option(20, 1_799_000)],
    }
    render(<PlanCardV2 tier={yearly} currentPlan={businessPlan({ seatsLabel: '20 Safe accounts' })} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })
  it('heads the feature list with the plan support level', () => {
    render(<PlanCardV2 tier={BUSINESS} />)

    expect(screen.getByText('Priority support, plus:')).toBeInTheDocument()
  })
})
