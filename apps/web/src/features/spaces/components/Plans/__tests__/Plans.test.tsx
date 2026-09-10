import { fireEvent, render, screen } from '@/tests/test-utils'
import type { Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PlanGroup } from '../../../hooks/billing/types'
import Plans from '../index'
import { remaining, seatsTooltip } from '../PlanStatusCard'
import { yearlyDiscount } from '../PlanCards'
import { buildPlanTiers } from '../planTiers'

const offer = (planName: string, paymentLinkId: string, price: number, billingCycle: 'month' | 'year') => ({
  paymentLinkId,
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
const business = (status: Subscription['status']) =>
  ({
    id: 'sub_1',
    status,
    plan: {
      id: 'price_b',
      name: 'Business',
      currentPrice: 499,
      originalPrice: null,
      currency: 'eur',
      billingCycle: 'month',
      features: [],
    },
  }) as unknown as Subscription

const trialing = { name: 'Business', status: 'trialing' as const, periodEndsAt: '2026-12-06T00:00:00Z' }
const active = { name: 'Business', status: 'active' as const, periodEndsAt: '2026-12-06T00:00:00Z' }
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
    const tiers = buildPlanTiers({ paidPlans: [STARTER], subscription: undefined, seatsQuota: undefined })
    expect(yearlyDiscount(tiers)).toBe(10)

    const monthlyOnly = buildPlanTiers({
      paidPlans: [{ ...STARTER, offers: STARTER.offers.slice(0, 1) }],
      subscription: undefined,
      seatsQuota: undefined,
    })
    expect(yearlyDiscount(monthlyOnly)).toBeNull()
  })

  it('renders the trial state: billing CTA, current plan card from the subscription and monthly offers', () => {
    const onManage = jest.fn()
    const tiers = buildPlanTiers({ paidPlans: [STARTER], subscription: business('trialing'), seatsQuota: 10 })
    render(<Plans plan={trialing} {...meters} tiers={tiers} onManage={onManage} />)

    expect(screen.getAllByText('Free trial')).toHaveLength(2)
    expect(screen.getByText(/Your free trial is active until Dec 6, 2026/)).toBeInTheDocument()
    expect(screen.getByText('€149')).toBeInTheDocument()
    expect(screen.getByText('€499')).toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.queryByText('€1,608')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('10 Safe accounts')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add billing details' }))
    expect(onManage).toHaveBeenCalled()
  })

  it('renders the paid state with the Manage plan CTA', () => {
    const tiers = buildPlanTiers({ paidPlans: [STARTER], subscription: business('active'), seatsQuota: 10 })
    render(<Plans plan={active} {...meters} tiers={tiers} isManaging />)

    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getByText('Safe accounts above the limit stay available outside the Workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manage plan' })).toBeDisabled()
  })

  it('shows placeholders and no plan chrome without a plan or meters', () => {
    const tiers = buildPlanTiers({ paidPlans: [], subscription: undefined, seatsQuota: undefined })
    render(<Plans plan={null} safeAccounts={null} sponsoredTxs={{ used: 0, quota: null }} tiers={tiers} />)

    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add billing details|Manage plan/ })).not.toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })
})
