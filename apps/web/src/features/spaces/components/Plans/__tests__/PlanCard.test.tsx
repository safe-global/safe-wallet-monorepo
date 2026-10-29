import { render, screen } from '@/tests/test-utils'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '@safe-global/views/features/spaces/components/Plans/types'
import { PlanLocation } from '@/services/analytics/mixpanel-events'
import { PlanCard } from '../PlanCard'

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

describe('PlanCard', () => {
  it('opens on the plan in force even when it is not the first Safe count', () => {
    render(
      <PlanCard
        location={PlanLocation.PLANS_PAGE}
        tier={currentTier('price_b10m')}
        currentPlan={businessPlan({ price: 1099 })}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('10 Safe accounts')
    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled()
  })

  it('follows a subscription that lands after the card mounted', () => {
    const { rerender } = render(
      <PlanCard location={PlanLocation.PLANS_PAGE} tier={{ ...currentTier(''), currentPriceId: undefined }} />,
    )
    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('5 Safe accounts')

    rerender(
      <PlanCard location={PlanLocation.PLANS_PAGE} tier={currentTier('price_b20m')} currentPlan={businessPlan()} />,
    )

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })

  it('marks only the plan in force as current', () => {
    const { rerender } = render(
      <PlanCard location={PlanLocation.PLANS_PAGE} tier={currentTier('price_b10m')} currentPlan={businessPlan()} />,
    )
    expect(screen.getByTestId('plan-current-badge')).toHaveTextContent('Current')

    rerender(
      <PlanCard
        location={PlanLocation.PLANS_PAGE}
        tier={{ ...BUSINESS, billingCycle: 'year' }}
        currentPlan={businessPlan()}
      />,
    )

    expect(screen.queryByTestId('plan-current-badge')).not.toBeInTheDocument()
  })

  it('opens the other billing cycle on the Safe count of the plan in force', () => {
    const yearly: PlanTier = {
      ...BUSINESS,
      id: 'Business-year',
      billingCycle: 'year',
      options: [option(5, 719_000), option(20, 1_799_000)],
    }
    render(
      <PlanCard
        location={PlanLocation.PLANS_PAGE}
        tier={yearly}
        currentPlan={businessPlan({ seatsLabel: '20 Safe accounts' })}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })

  it('shows the subtitle and support line from the plan copy, and nothing when it is empty', () => {
    const copy = { subtitle: 'Scale with control.', supportLevel: 'Priority', supportDetail: '+ Guided onboarding' }
    const { rerender } = render(<PlanCard location={PlanLocation.PLANS_PAGE} tier={{ ...BUSINESS, copy }} />)

    expect(screen.getByText('Scale with control.')).toBeInTheDocument()
    expect(screen.getByTestId('plan-support-level')).toHaveTextContent('Priority support')
    expect(screen.getByText('+ Guided onboarding')).toBeInTheDocument()

    rerender(<PlanCard location={PlanLocation.PLANS_PAGE} tier={BUSINESS} />)
    expect(screen.queryByText('Scale with control.')).not.toBeInTheDocument()
    expect(screen.queryByTestId('plan-support')).not.toBeInTheDocument()
  })
})
