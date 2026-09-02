import { render, screen } from '@/tests/test-utils'
import Plans from '../index'
import { remaining } from '../PlanStatusCard'
import { yearlyDiscount } from '../PlanCards'
import { TIERS, TRIAL_PLANS } from '../fixtures'

describe('Plans', () => {
  it.each([
    [{ used: 6, quota: 10 }, 4],
    [{ used: 12, quota: 10 }, 0],
    [{ used: 3, quota: null }, null],
  ])('remaining(%p) → %p', (meter, expected) => {
    expect(remaining(meter)).toBe(expected)
  })

  it('derives the yearly discount from the plan prices, or null without a yearly plan', () => {
    expect(yearlyDiscount(TIERS)).toBe(10)
    expect(yearlyDiscount(TIERS.filter((tier) => tier.billingCycle !== 'year'))).toBeNull()
  })

  it('renders the trial state with the billing CTA and monthly tiers', () => {
    render(<Plans data={TRIAL_PLANS} />)

    expect(screen.getAllByText('Free trial')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Add billing details' })).toBeInTheDocument()
    expect(screen.getByText('€149')).toBeInTheDocument()
    expect(screen.queryByText('€1,608')).not.toBeInTheDocument()
  })

  it('shows unlimited quotas and no plan chrome on the free tier', () => {
    render(<Plans data={{ ...TRIAL_PLANS, plan: null, sponsoredTxs: { used: 0, quota: null } }} />)

    expect(screen.getByText('Unlimited')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add billing details' })).not.toBeInTheDocument()
  })
})
