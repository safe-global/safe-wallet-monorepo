import { fireEvent, render, screen } from '@/tests/test-utils'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import type { PlanGroup } from '../../../hooks/billing/types'
import Plans from '../index'
import { getCurrentBadge, _remaining, seatsTooltip } from '../PlanStatusCard'
import { buildPlanTiers } from '../planTiers'
import type { CurrentPlan, PlanSummary } from '../types'

const offer = (planName: string, paymentLinkId: string, price: number, billingCycle: 'month' | 'year') => ({
  paymentLinkId,
  priceId: `price_${paymentLinkId}`,
  planName,
  seats: 2,
  price,
  currency: 'eur',
  billingCycle,
  trialPeriodDays: null,
})
const STARTER: PlanGroup = {
  name: 'Starter',
  offers: [offer('Starter', 'pl_starter_m', 149, 'month'), offer('Starter', 'pl_starter_y', 1608, 'year')],
}
const BUSINESS: PlanGroup = { name: 'Business', offers: [offer('Business', 'pl_business_m', 499, 'month')] }

const subscription = (name: string, currentPrice: number) =>
  ({
    id: 'sub_1',
    status: 'active',
    plan: {
      id: `price_${name}`,
      name,
      currentPrice,
      originalPrice: null,
      currency: 'eur',
      billingCycle: 'month',
      features: [],
    },
  }) as unknown as Subscription

const current = (name: string, price: number, isTrialing: boolean, hasPaymentMethod = false): CurrentPlan => ({
  name,
  price,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing,
  hasPaymentMethod,
  periodEndsAt: '2026-12-06T00:00:00Z',
})
const trialing = (daysLeft: number): PlanSummary => ({
  name: 'Business',
  status: 'trialing',
  periodEndsAt: '2026-12-06T00:00:00Z',
  daysLeft,
})
const active: PlanSummary = { name: 'Business', status: 'active', periodEndsAt: '2026-12-06T00:00:00Z', daysLeft: 20 }
const meters = { safeAccounts: { used: 6, quota: 10 }, sponsoredTxs: { used: 11, quota: 15 } }

describe('Plans', () => {
  it.each([
    [{ used: 6, quota: 10 }, 4],
    [{ used: 12, quota: 10 }, 0],
    [{ used: 3, quota: null }, null],
  ])('_remaining(%p) → %p', (meter, expected) => {
    expect(_remaining(meter)).toBe(expected)
  })

  it('adapts the seats tooltip to the tier and quota', () => {
    expect(seatsTooltip('Business', 10)).toMatch(/^Business covers 10 Safe accounts/)
    expect(seatsTooltip(undefined, null)).toMatch(/^Your plan covers unlimited Safe accounts/)
  })

  it('advertises the yearly saving as a fixed ceiling, only when a yearly offer exists', () => {
    const { unmount } = render(<Plans plan={null} {...meters} tiers={buildPlanTiers([STARTER])} />)
    expect(screen.getByRole('tab', { name: /Yearly/ })).toHaveTextContent('Save up to 13%')
    unmount()

    render(
      <Plans plan={null} {...meters} tiers={buildPlanTiers([{ ...STARTER, offers: STARTER.offers.slice(0, 1) }])} />,
    )
    expect(screen.getByRole('tab', { name: /Yearly/ })).toHaveTextContent(/^Yearly$/)
  })

  it.each([
    [null, undefined],
    [active, { label: 'Active', variant: 'brand' }],
    [trialing(20), { label: 'Free access', variant: 'brand' }],
    [trialing(14), { label: 'Free access · 14 days left', variant: 'brand' }],
    [trialing(1), { label: 'Free access · 1 day left', variant: 'warning' }],
    [trialing(7), { label: 'Free access · 7 days left', variant: 'warning' }],
    [
      { ...trialing(14), daysLeft: null },
      { label: 'Free access', variant: 'brand' },
    ],
  ])('derives the plan badge for %p', (plan, badge) => {
    expect(getCurrentBadge(plan)).toEqual(badge)
  })

  it('renders a trial with the countdown, the current plan card asking for billing details and Starter on offer', () => {
    const onManage = jest.fn()
    const onSubscribe = jest.fn()
    render(
      <Plans
        plan={trialing(14)}
        {...meters}
        tiers={buildPlanTiers([STARTER], { subscription: subscription('Business', 499), seatsQuota: 20 })}
        onManage={onManage}
        onSubscribe={onSubscribe}
        currentPlan={current('Business', 499, true)}
      />,
    )

    expect(screen.getAllByText('Free access · 14 days left')).toHaveLength(2)
    expect(screen.getByText('Active until Dec 6, 2026.')).toBeInTheDocument()
    expect(screen.getByTestId('trial-disclaimer')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Manage plan' })).not.toBeInTheDocument()
    expect(screen.getByTestId('current-plan-card')).toHaveTextContent('€499')
    expect(screen.getByText('€149')).toBeInTheDocument()
    expect(screen.queryByText('€1,608')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add payment method' }))
    expect(onManage).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(onSubscribe).toHaveBeenCalledWith({
      tier: expect.objectContaining({ name: 'Starter' }),
      option: expect.objectContaining({ paymentLinkId: 'pl_starter_m', priceId: 'price_pl_starter_m' }),
    })
    expect(screen.getByRole('link', { name: 'Talk to sales' })).toHaveAttribute('href', SUPPORT_CHAT_URL)
  })

  it('swaps the payment nudge and its button for Manage plan once a payment method is on file', () => {
    render(
      <Plans
        plan={{ ...trialing(7), hasPaymentMethod: true }}
        {...meters}
        tiers={buildPlanTiers([STARTER], { subscription: subscription('Business', 499), seatsQuota: 20 })}
        onManage={jest.fn()}
        onSubscribe={jest.fn()}
        currentPlan={current('Business', 499, true, true)}
      />,
    )

    expect(screen.getByText('Active until Dec 6, 2026.')).toBeInTheDocument()
    expect(screen.queryByText(/Add a payment method before then/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add payment method' })).not.toBeInTheDocument()
    expect(screen.getByTestId('current-plan-card')).toContainElement(
      screen.getByRole('button', { name: 'Manage plan' }),
    )
    expect(screen.queryByTestId('trial-disclaimer')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to Starter' })).toBeInTheDocument()
  })

  it('turns the trial into a warning in its last week', () => {
    render(
      <Plans
        plan={trialing(7)}
        {...meters}
        tiers={buildPlanTiers([STARTER], { subscription: subscription('Business', 499), seatsQuota: 20 })}
        currentPlan={current('Business', 499, true)}
      />,
    )

    expect(
      screen.getByText(
        /Your free access is active until Dec 6, 2026\. Add a payment method before then or choose another plan/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId('plan-status-badge')).toHaveTextContent('Free access · 7 days left')
  })

  it('renders a paid plan with Manage plan in the header and on its card, and Upgrade to Business on offer', () => {
    const onManage = jest.fn()
    render(
      <Plans
        plan={{ ...active, name: 'Starter' }}
        {...meters}
        tiers={buildPlanTiers([BUSINESS], { subscription: subscription('Starter', 149), seatsQuota: 2 })}
        onManage={onManage}
        onSubscribe={jest.fn()}
        currentPlan={current('Starter', 149, false)}
      />,
    )

    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(
      screen.getByText('Safe accounts above the limit remain available outside the Workspace.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Manage plan' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Upgrade to Business' })).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Manage plan' })[1])
    expect(onManage).toHaveBeenCalled()
  })

  it('hides every plan button, header included, for a viewer who cannot act on the plan', () => {
    render(
      <Plans
        plan={{ ...active, name: 'Starter' }}
        {...meters}
        tiers={buildPlanTiers([BUSINESS], { subscription: subscription('Starter', 149), seatsQuota: 2 })}
        onManage={jest.fn()}
        onSubscribe={jest.fn()}
        currentPlan={current('Starter', 149, false)}
        readOnly
      />,
    )

    expect(screen.getByTestId('current-plan-card')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Manage plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upgrade to Business' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Only admins can change the plan. Ask an admin to upgrade, switch or change seats.'),
    ).toBeInTheDocument()
  })

  it('keeps the read-only note away from admins', () => {
    render(
      <Plans
        plan={{ ...active, name: 'Starter' }}
        {...meters}
        tiers={buildPlanTiers([BUSINESS], { subscription: subscription('Starter', 149), seatsQuota: 2 })}
        onManage={jest.fn()}
        onSubscribe={jest.fn()}
        currentPlan={current('Starter', 149, false)}
      />,
    )

    expect(screen.queryByText(/Only admins can change the plan/)).not.toBeInTheDocument()
  })

  it('shows the current plan on its own cycle and the offered plan of the other cycle under the toggle', () => {
    const business = {
      name: 'Business',
      offers: [offer('Business', 'pl_business_5', 299, 'month'), offer('Business', 'pl_business_y', 6990, 'year')],
    }
    render(
      <Plans
        plan={trialing(14)}
        {...meters}
        tiers={buildPlanTiers([business], { subscription: subscription('Business', 499), seatsQuota: 20 })}
        currentPlan={current('Business', 499, true)}
      />,
    )

    expect(screen.getByTestId('current-plan-card')).toHaveTextContent('€499')
    expect(screen.getByTestId('current-plan-card')).toHaveTextContent('20 Safe accounts')
    expect(screen.getByTestId('current-plan-card')).toHaveClass('bg-card', 'shadow-lg')
    expect(screen.getByTestId('current-plan-card')).not.toHaveClass('border-mint')
    expect(screen.queryByText('€6,990')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Yearly/ }))
    expect(screen.queryByTestId('current-plan-card')).not.toBeInTheDocument()
    expect(screen.getByText('€6,990')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upgrade to 2 Safe accounts' })).toBeInTheDocument()
  })

  it('names the picked seat option on the closed selector instead of its payment link id', () => {
    const business = {
      name: 'Business',
      offers: [
        offer('Business', 'pl_business_10', 499, 'month'),
        { ...offer('Business', 'pl_business_50', 999, 'month'), seats: 50 },
      ],
    }
    render(<Plans plan={null} {...meters} tiers={buildPlanTiers([business])} />)

    expect(screen.getByText('2 Safe accounts')).toBeInTheDocument()
    expect(screen.queryByText('pl_business_10')).not.toBeInTheDocument()
  })

  it('flags an exhausted meter', () => {
    render(
      <Plans
        plan={active}
        safeAccounts={{ used: 20, quota: 20 }}
        sponsoredTxs={{ used: 3, quota: 15 }}
        tiers={buildPlanTiers([])}
      />,
    )

    expect(screen.getByTestId('meter-exhausted')).toHaveTextContent('0 / 20')
    // Only the dot flags the exhausted meter; the number keeps the regular colour, as designed.
    expect(screen.getAllByTestId('meter-left')[0]).not.toHaveClass('text-destructive')
  })

  it('shows the locked state and sells an offered plan when the Workspace has none', () => {
    const onSubscribe = jest.fn()
    render(
      <Plans
        plan={null}
        safeAccounts={null}
        sponsoredTxs={{ used: 0, quota: null }}
        tiers={buildPlanTiers([STARTER])}
        onSubscribe={onSubscribe}
      />,
    )

    expect(screen.getByText('No active plan')).toBeInTheDocument()
    expect(screen.getByText(/Your Workspace is locked until you choose a plan/)).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add payment method|Manage plan/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Starter' }))
    expect(onSubscribe).toHaveBeenCalledWith({
      tier: expect.objectContaining({ name: 'Starter' }),
      option: expect.objectContaining({ paymentLinkId: 'pl_starter_m', priceId: 'price_pl_starter_m' }),
    })
  })

  it('keeps the Stripe portal reachable for a lapsed subscription', () => {
    render(<Plans plan={null} {...meters} tiers={buildPlanTiers([STARTER])} canManage onManage={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Manage plan' })).toBeInTheDocument()
  })
})
