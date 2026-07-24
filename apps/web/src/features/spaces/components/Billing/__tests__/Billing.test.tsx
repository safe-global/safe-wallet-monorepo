import { render, screen } from '@/tests/test-utils'
import Billing from '../index'
import { BillingDataProvider } from '../BillingDataContext'
import { createPaidBillingState, createStarterBillingState } from '../mocks'
import type { BillingState } from '../types'

const renderBilling = (value: BillingState) =>
  render(
    <BillingDataProvider value={value}>
      <Billing />
    </BillingDataProvider>,
  )

describe('Billing', () => {
  it('renders the subscription section and plans in the paid state', () => {
    renderBilling(createPaidBillingState())

    expect(screen.getByTestId('billing-subscription-section')).toBeInTheDocument()
    expect(screen.getByTestId('billing-plans-section')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-upsell-banner')).not.toBeInTheDocument()
  })

  it('renders the upsell banner (no subscription header) and plans in the Starter state', () => {
    renderBilling(createStarterBillingState())

    expect(screen.getByTestId('billing-upsell-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-subscription-section')).not.toBeInTheDocument()
    expect(screen.getByTestId('billing-plans-section')).toBeInTheDocument()
  })
})
