import { fireEvent, render, screen } from '@/tests/test-utils'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import type { PlanGroup } from '../../../hooks/billing/types'
import Plans from '../index'
import { getCurrentBadge, remaining, seatsTooltip } from '../PlanStatusCard'
import { yearlyDiscount } from '../PlanCards'
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

const current = (name: string, price: number, isTrialing: boolean): CurrentPlan => ({
  name,
  price,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing,
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
  ])('remaining(%p) → %p', (meter, expected) => {
    expect(remaining(meter)).toBe(expected)
  })

  it('adapts the seats tooltip to the tier and quota', () => {
    expect(seatsTooltip('Business', 10)).toMatch(/^Business includes 10 Safe accounts/)
    expect(seatsTooltip(undefined, null)).toMatch(/^Your plan includes unlimited Safe accounts/)
  })

  it('derives the yearly discount from the offers, or null without a yearly one', () => {
    expect(yearlyDiscount(buildPlanTiers([STARTER]))).toBe(10)
    expect(yearlyDiscount(buildPlanTiers([{ ...STARTER, offers: STARTER.offers.slice(0, 1) }]))).toBeNull()
  })

  it.each([
    [null, undefined],
    [active, { label: 'Active', variant: 'brand' }],
    [trialing(20), { label: 'Free trial', variant: 'brand' }],
    [trialing(14), { label: 'Free trial · 14 days left', variant: 'brand' }],
    [trialing(1), { label: 'Free trial · 1 day left', variant: 'warning' }],
    [trialing(7), { label: 'Free trial · 7 days left', variant: 'warning' }],
    [
      { ...trialing(14), daysLeft: null },
      { label: 'Free trial', variant: 'brand' },
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

    expect(screen.getAllByText('Free trial · 14 days left')).toHaveLength(2)
    expect(screen.getByText('Active until Dec 6, 2026.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Manage plan' })).not.toBeInTheDocument()
    expect(screen.getByTestId('current-plan-card')).toHaveTextContent('€499')
    expect(screen.getByText('€149')).toBeInTheDocument()
    expect(screen.queryByText('€1,608')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add billing details' }))
    expect(onManage).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(onSubscribe).toHaveBeenCalledWith({
      tier: expect.objectContaining({ name: 'Starter' }),
      option: expect.objectContaining({ paymentLinkId: 'pl_starter_m', priceId: 'price_pl_starter_m' }),
    })
    expect(screen.getByRole('link', { name: 'Talk to sales' })).toHaveAttribute('href', SUPPORT_CHAT_URL)
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
        /Your free trial is active until Dec 6, 2026\. Add billing details before then or choose another plan/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByTestId('plan-status-badge')).toHaveTextContent('Free trial · 7 days left')
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
    expect(screen.queryByRole('button', { name: /Add billing details|Manage plan/ })).not.toBeInTheDocument()

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
