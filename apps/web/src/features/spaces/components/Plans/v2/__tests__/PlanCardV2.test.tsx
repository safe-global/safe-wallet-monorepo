import { fireEvent, render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import type { CurrentPlan, PlanSeatOption, PlanTier } from '../../types'
import { PlanCardV2 } from '../PlanCardV2'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const expectPlansClick = (location: SAFE_PRO_PLANS_LABELS) =>
  expect(trackEvent).toHaveBeenCalledWith(
    { ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: location },
    { [MixpanelEventParams.LOCATION]: location },
  )

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
  it('reprices the card when another Safe count is picked', async () => {
    const { user } = renderWithUserEvent(<PlanCardV2 tier={BUSINESS} />)

    const trigger = screen.getByRole('combobox', { name: 'Safe accounts for Business' })
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await user.click(await screen.findByRole('option', { name: '5 Safe accounts' }))

    expect(screen.getByText('€669')).toBeInTheDocument()
  })

  it('hands the picked offer to onSubscribe', () => {
    const onSubscribe = jest.fn()
    render(<PlanCardV2 tier={BUSINESS} onSubscribe={onSubscribe} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Business' }))

    expect(onSubscribe).toHaveBeenCalledWith({ tier: BUSINESS, option: BUSINESS.options[0] })
  })

  it('shows a member who is not an admin the price but no button or sales link', () => {
    render(<PlanCardV2 tier={BUSINESS} readOnly />)

    expect(screen.getByTestId('plan-price-line')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Talk to sales' })).not.toBeInTheDocument()
  })

  it('tracks the Talk to sales link next to the Business button', () => {
    render(<PlanCardV2 tier={BUSINESS} />)

    fireEvent.click(screen.getByRole('link', { name: 'Talk to sales' }))

    expectPlansClick(SAFE_PRO_PLANS_LABELS.talk_to_sales)
  })

  it('disables the button of the plan in force', () => {
    render(
      <PlanCardV2 tier={{ ...BUSINESS, isCurrent: true, currentPriceId: 'price_b20m' }} currentPlan={businessPlan()} />,
    )

    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled()
  })

  it('sends a trial without a payment method to billing, not to the change-plan flow', () => {
    const onManage = jest.fn()
    const onSubscribe = jest.fn()
    render(
      <PlanCardV2
        tier={currentTier('price_b20m')}
        currentPlan={businessPlan({ isTrialing: true })}
        onManage={onManage}
        onSubscribe={onSubscribe}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add payment method' }))

    expect(onManage).toHaveBeenCalledTimes(1)
    expect(onSubscribe).not.toHaveBeenCalled()
  })

  it('disables the plan button while a checkout or portal redirect is in flight', () => {
    render(<PlanCardV2 tier={BUSINESS} isBusy />)

    expect(screen.getByRole('button', { name: 'Continue with Business' })).toBeDisabled()
  })

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

  it('tracks the account-team link on a current Enterprise card', () => {
    render(
      <PlanCardV2
        tier={{ ...currentTier('price_b20m'), name: 'Enterprise' }}
        currentPlan={businessPlan({ name: 'Enterprise' })}
      />,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Change via your account team' }))

    expectPlansClick(SAFE_PRO_PLANS_LABELS.account_team)
  })
})
