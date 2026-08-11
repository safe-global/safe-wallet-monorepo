import { render, screen } from '@/tests/test-utils'
import SubscriptionSection from '../sections/SubscriptionSection'
import { BillingDataProvider } from '../BillingDataContext'
import { createPaidBillingState, createStarterBillingState } from '../mocks'
import type { BillingState } from '../types'

const renderSection = (value: BillingState) =>
  render(
    <BillingDataProvider value={value}>
      <SubscriptionSection />
    </BillingDataProvider>,
  )

describe('SubscriptionSection', () => {
  it('renders nothing in the Starter (no-paid-plan) state', () => {
    const { container } = renderSection(createStarterBillingState())
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the plan name, manage-plan action and both usage tiles in the paid state', () => {
    renderSection(createPaidBillingState())

    expect(screen.getByTestId('billing-subscription-section')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByTestId('billing-manage-plan')).toBeInTheDocument()
    expect(screen.getByTestId('billing-usage-volume')).toBeInTheDocument()
    expect(screen.getByTestId('billing-usage-gasless')).toBeInTheDocument()
    expect(screen.getByTestId('billing-safes-selector')).toHaveTextContent('Active on 4 Safes')
  })

  it('shows the "Within limit" badge, renewal date and no tile dots for healthy usage', () => {
    renderSection(createPaidBillingState('within_limit'))

    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Within limit')
    expect(screen.getByTestId('billing-renewal-line')).toHaveTextContent('Renews on')
    expect(screen.queryByTestId('billing-usage-volume-dot')).not.toBeInTheDocument()
    expect(screen.queryByTestId('billing-usage-gasless-dot')).not.toBeInTheDocument()
  })

  it('shows the "Approaching limit" badge and a warning dot on over-threshold tiles', () => {
    renderSection(createPaidBillingState('approaching_limit'))

    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Approaching limit')
    expect(screen.getByTestId('billing-usage-volume-dot')).toBeInTheDocument()
  })

  it('shows the "Limit reached" badge and PAYG messaging when over the allowance', () => {
    renderSection(createPaidBillingState('limit_reached'))

    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Limit reached')
    expect(screen.getByText(/pay-as-you-go rates/)).toBeInTheDocument()
  })

  it('shows the "Payment failed" badge and "Renewal failed" line and hides the usage tiles for a past_due subscription', () => {
    renderSection(createPaidBillingState('payment_failed'))

    expect(screen.getByTestId('billing-status-badge')).toHaveTextContent('Payment failed')
    expect(screen.getByTestId('billing-renewal-line')).toHaveTextContent('Renewal failed')
    expect(screen.queryByTestId('billing-usage-volume')).not.toBeInTheDocument()
    expect(screen.queryByTestId('billing-usage-gasless')).not.toBeInTheDocument()
  })
})
