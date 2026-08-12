import { render, screen } from '@/tests/test-utils'
import Billing from '../index'
import { subscriptionFixture } from '../../../hooks/billing/testFixtures'
import type { BillingState } from '@/features/spaces'

const mockUseBillingPage = jest.fn()
jest.mock('@/features/spaces/hooks/billing/useBillingPage', () => ({
  useBillingPage: () => mockUseBillingPage(),
}))

// PlansSection has its own data hooks; stub it to isolate the page orchestration.
jest.mock('../sections/PlansSection', () => ({
  __esModule: true,
  default: () => <div data-testid="billing-plans-section" />,
}))

const billingPage = (overrides: Record<string, unknown> = {}) => ({
  state: 'none' as BillingState,
  subscription: undefined,
  isLoading: false,
  checkoutStatus: 'idle' as const,
  isReturning: false,
  dismissCheckout: jest.fn(),
  ...overrides,
})

describe('Billing', () => {
  it('shows the Starter upsell (no subscription card) with no paid plan', () => {
    mockUseBillingPage.mockReturnValue(billingPage())
    render(<Billing />)

    expect(screen.getByTestId('billing-upsell-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-subscription-section')).not.toBeInTheDocument()
    expect(screen.getByTestId('billing-plans-section')).toBeInTheDocument()
  })

  it('shows the subscription card for an active plan', () => {
    mockUseBillingPage.mockReturnValue(billingPage({ state: 'active', subscription: subscriptionFixture() }))
    render(<Billing />)

    expect(screen.getByTestId('billing-subscription-section')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-upsell-banner')).not.toBeInTheDocument()
  })

  it('shows the checkout return banner while activating', () => {
    mockUseBillingPage.mockReturnValue(
      billingPage({ state: 'activating', isReturning: true, checkoutStatus: 'activating' }),
    )
    render(<Billing />)

    expect(screen.getByTestId('billing-checkout-activating')).toBeInTheDocument()
    // No subscription card during activation.
    expect(screen.queryByTestId('billing-subscription-section')).not.toBeInTheDocument()
  })
})
