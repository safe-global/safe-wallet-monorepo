import { render, screen } from '@/tests/test-utils'
import SubscriptionSection from '../sections/SubscriptionSection'
import { subscriptionFixture } from '../../../hooks/billing/testFixtures'

const mockOpenPortal = jest.fn()
jest.mock('@/features/spaces/hooks/billing/useManagePlan', () => ({
  useManagePlan: () => ({ openPortal: mockOpenPortal, isRedirecting: false, error: false }),
}))

describe('SubscriptionSection', () => {
  it('renders the plan name, active badge, renewal date and Safe allowance', () => {
    const subscription = subscriptionFixture({ validUntil: 1_800_000_000, metadata: { FEATURE_NUMBER_OF_SAFES: '25' } })
    render(<SubscriptionSection subscription={subscription} state="active" />)

    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Active')
    expect(screen.getByTestId('billing-renewal-line')).toHaveTextContent(/Renews on/)
    expect(screen.getByText(/covers up to 25 Safe Accounts/)).toBeInTheDocument()
  })

  it('shows "Renewal failed" and a Payment failed badge for a past_due subscription', () => {
    const subscription = subscriptionFixture({ status: 'past_due' })
    render(<SubscriptionSection subscription={subscription} state="payment_failed" />)

    expect(screen.getByTestId('billing-renewal-line')).toHaveTextContent('Renewal failed')
    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Payment failed')
  })

  it('shows an end date and Canceled badge for a canceled subscription', () => {
    const subscription = subscriptionFixture({ status: 'canceled', cancelAt: 1_800_000_000, validUntil: null })
    render(<SubscriptionSection subscription={subscription} state="canceled" />)

    expect(screen.getByTestId('billing-renewal-line')).toHaveTextContent(/Ends on/)
    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Canceled')
  })

  it('opens the Stripe portal when Manage plan is clicked', () => {
    render(<SubscriptionSection subscription={subscriptionFixture()} state="active" />)

    screen.getByTestId('billing-manage-plan').click()
    expect(mockOpenPortal).toHaveBeenCalled()
  })
})
