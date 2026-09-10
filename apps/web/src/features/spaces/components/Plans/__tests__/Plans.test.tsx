import { fireEvent, render, screen } from '@/tests/test-utils'
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
    expect(yearlyDiscount(buildPlanTiers([STARTER]))).toBe(10)
    expect(yearlyDiscount(buildPlanTiers([{ ...STARTER, offers: STARTER.offers.slice(0, 1) }]))).toBeNull()
  })

  it('renders the trial state: billing CTA, the current plan only in the status card, monthly offers on sale', () => {
    const onManage = jest.fn()
    const onSubscribe = jest.fn()
    render(
      <Plans
        plan={trialing}
        {...meters}
        tiers={buildPlanTiers([STARTER])}
        onManage={onManage}
        onSubscribe={onSubscribe}
      />,
    )

    expect(screen.getAllByText('Free trial')).toHaveLength(1)
    expect(screen.getByText(/Your free trial is active until Dec 6, 2026/)).toBeInTheDocument()
    expect(screen.getByText('€149')).toBeInTheDocument()
    expect(screen.queryByText('€499')).not.toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.queryByText('€1,608')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add billing details' }))
    expect(onManage).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Choose plan' }))
    expect(onSubscribe).toHaveBeenCalledWith('pl_starter_m')
    expect(screen.getByRole('button', { name: 'Coming soon' })).toBeInTheDocument()
  })

  it('renders the paid state with the Manage plan CTA', () => {
    render(<Plans plan={active} {...meters} tiers={buildPlanTiers([STARTER])} isManaging />)

    expect(screen.getAllByText('Active')).toHaveLength(1)
    expect(screen.getByText('Safe accounts above the limit stay available outside the Workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manage plan' })).toBeDisabled()
  })

  it('shows the locked state and lets the Workspace buy an offered plan when it has none', () => {
    const onSubscribe = jest.fn()
    const tiers = buildPlanTiers([STARTER])
    render(
      <Plans
        plan={null}
        safeAccounts={null}
        sponsoredTxs={{ used: 0, quota: null }}
        tiers={tiers}
        onSubscribe={onSubscribe}
      />,
    )

    expect(screen.getByText('No active plan')).toBeInTheDocument()
    expect(screen.getByText(/Your Workspace is locked until you choose a plan/)).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Unlimited')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add billing details|Manage plan/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Choose plan' }))
    expect(onSubscribe).toHaveBeenCalledWith('pl_starter_m')
    expect(screen.getByRole('button', { name: 'Coming soon' })).toBeInTheDocument()
  })

  it('keeps the Stripe portal reachable for a lapsed subscription', () => {
    render(<Plans plan={null} {...meters} tiers={buildPlanTiers([STARTER])} canManage onManage={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Manage plan' })).toBeInTheDocument()
  })
})
