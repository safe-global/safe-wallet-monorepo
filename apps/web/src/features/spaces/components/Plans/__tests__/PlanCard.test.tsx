import { useState } from 'react'
import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
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

const selectedSize = () => screen.getByRole('tab', { selected: true })

describe('PlanCard', () => {
  it('opens on the plan in force even when it is not the first Safe count', () => {
    render(
      <PlanCard
        location={PlanLocation.PLANS_PAGE}
        tier={currentTier('price_b10m')}
        currentPlan={businessPlan({ price: 1099 })}
      />,
    )

    expect(selectedSize()).toHaveAccessibleName('10 Safe accounts')
    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled()
  })

  it('follows a subscription that lands after the card mounted', () => {
    const { rerender } = render(
      <PlanCard location={PlanLocation.PLANS_PAGE} tier={{ ...currentTier(''), currentPriceId: undefined }} />,
    )
    expect(screen.queryByRole('tab', { selected: true })).not.toBeInTheDocument()

    rerender(
      <PlanCard location={PlanLocation.PLANS_PAGE} tier={currentTier('price_b20m')} currentPlan={businessPlan()} />,
    )

    expect(selectedSize()).toHaveAccessibleName('20 Safe accounts')
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

    expect(selectedSize()).toHaveAccessibleName('20 Safe accounts')
  })

  describe('without a paid plan', () => {
    const trial = businessPlan({ isTrialing: true, price: 669, seatsLabel: '5 Safe accounts' })

    it('opens the trial plan on its own size and price, marked as current and featured', () => {
      render(<PlanCard location={PlanLocation.PLANS_PAGE} tier={currentTier('price_b5m')} currentPlan={trial} />)

      expect(selectedSize()).toHaveAccessibleName('5 Safe accounts')
      expect(screen.getByText('€669')).toBeInTheDocument()
      expect(screen.queryByText('Custom')).not.toBeInTheDocument()
      expect(screen.getByTestId('plan-current-badge')).toHaveTextContent('Current')
      expect(screen.getByTestId('current-plan-card')).not.toHaveAttribute('data-hover-plan')
      expect(screen.getByRole('button', { name: 'Add payment method' })).toBeInTheDocument()
    })

    it('opens the trial plan on the other billing cycle on the trial size', () => {
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
          currentPlan={businessPlan({ isTrialing: true, seatsLabel: '20 Safe accounts' })}
        />,
      )

      expect(selectedSize()).toHaveAccessibleName('20 Safe accounts')
      expect(screen.getByText('€17,990')).toBeInTheDocument()
      expect(screen.getByTestId('plan-card')).not.toHaveAttribute('data-hover-plan')
    })

    it.each([
      ['the trial size is not sold on that cycle', '20 Safe accounts'],
      ['the trial size is not known yet', undefined],
    ])('keeps the trial plan on the other billing cycle unpicked when %s', (_, seatsLabel) => {
      const yearly: PlanTier = {
        ...BUSINESS,
        id: 'Business-year',
        billingCycle: 'year',
        options: [option(5, 719_000), option(10, 1_199_000)],
      }
      render(
        <PlanCard
          location={PlanLocation.PLANS_PAGE}
          tier={yearly}
          currentPlan={businessPlan({ isTrialing: true, seatsLabel })}
        />,
      )

      expect(screen.queryByRole('tab', { selected: true })).not.toBeInTheDocument()
      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.queryByText('€7,190')).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Talk to sales' })).toBeInTheDocument()
      expect(screen.getByTestId('plan-card')).not.toHaveAttribute('data-hover-plan')
    })

    it('shows another plan with a custom price and only sales until a size is picked, then the price and a switch', async () => {
      const onCta = jest.fn()
      const starterTrial = businessPlan({
        name: 'Starter',
        isTrialing: true,
        price: 189,
        seatsLabel: '2 Safe accounts',
      })
      const Picker = () => {
        const [seatsLabel, setSeatsLabel] = useState<string>()
        return (
          <PlanCard
            location={PlanLocation.PLANS_PAGE}
            tier={{ ...BUSINESS, options: [option(5, 66_900), option(10, 109_900), option(20, 166_900)] }}
            currentPlan={starterTrial}
            seatsLabel={seatsLabel}
            onSeatsChange={setSeatsLabel}
            onCta={onCta}
          />
        )
      }
      const { user } = renderWithUserEvent(<Picker />)

      expect(screen.getByText('Custom')).toBeInTheDocument()
      expect(screen.queryByText('€669')).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { selected: true })).not.toBeInTheDocument()
      expect(screen.queryByTestId('plan-current-badge')).not.toBeInTheDocument()
      expect(screen.getByTestId('plan-card')).toHaveAttribute('data-hover-plan')
      expect(within(screen.getByTestId('plan-ctas')).getAllByRole('link')).toHaveLength(1)
      expect(screen.getByRole('link', { name: 'Talk to sales' })).toBeInTheDocument()

      await user.click(screen.getByRole('tab', { name: '10 Safe accounts' }))

      expect(selectedSize()).toHaveAccessibleName('10 Safe accounts')
      expect(screen.getByText('€1,099')).toBeInTheDocument()
      expect(screen.queryByText('Custom')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Switch to Business 10' })).toBeInTheDocument()
    })

    it('offers the best yearly saving before a size is picked', () => {
      const yearly: PlanTier = {
        ...BUSINESS,
        id: 'Business-year',
        billingCycle: 'year',
        options: [option(5, 762_800), option(20, 1_799_000)],
      }
      render(
        <PlanCard
          location={PlanLocation.LOCKED_MODAL}
          tier={BUSINESS}
          counterpartTier={yearly}
          onSwitchToYearly={jest.fn()}
        />,
      )

      expect(screen.getByRole('button', { name: 'Save up to 10.2% with yearly' })).toBeInTheDocument()
    })

    it('prices a plan with a single size right away', () => {
      render(
        <PlanCard
          location={PlanLocation.LOCKED_MODAL}
          tier={{ ...BUSINESS, name: 'Starter', options: [option(2, 18_900)] }}
        />,
      )

      expect(screen.getByText('€189')).toBeInTheDocument()
      expect(screen.getByTestId('plan-seats-fixed')).toHaveTextContent('2 Safes')
      expect(screen.getByRole('button', { name: 'Continue with Starter' })).toBeInTheDocument()
    })
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
