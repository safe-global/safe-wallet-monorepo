import { render, screen, fireEvent } from '@/tests/test-utils'
import PlanCard from '../sections/PlansSection/PlanCard'
import { paymentLinkFixture } from '../../../hooks/billing/testFixtures'

describe('PlanCard', () => {
  it('renders the plan name, price (from line items) and features from metadata', () => {
    const paymentLink = paymentLinkFixture({
      metadata: { planName: 'Pro', FEATURE_NUMBER_OF_SAFES: '25' },
      lineItems: [{ price: { unitAmount: 4900, currency: 'usd', recurring: { interval: 'month' } }, quantity: 1 }],
    })
    render(<PlanCard paymentLink={paymentLink} />)

    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('$49')).toBeInTheDocument()
    expect(screen.getByText('Covers up to 25 Safe Accounts')).toBeInTheDocument()
  })

  it('calls onSelect with the payment link id when the CTA is clicked', () => {
    const paymentLink = paymentLinkFixture({ id: 'pl_42' })
    const onSelect = jest.fn()
    render(<PlanCard paymentLink={paymentLink} onSelect={onSelect} />)

    fireEvent.click(screen.getByTestId('billing-plan-cta-pl_42'))
    expect(onSelect).toHaveBeenCalledWith('pl_42')
  })

  it('renders a non-actionable "Current plan" label for the active plan', () => {
    const paymentLink = paymentLinkFixture({ id: 'pl_current' })
    const onSelect = jest.fn()
    render(<PlanCard paymentLink={paymentLink} isCurrent onSelect={onSelect} />)

    expect(screen.getByText('Current plan')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-plan-cta-pl_current')).not.toBeInTheDocument()
  })

  it('disables the CTA while a checkout redirect is in flight', () => {
    const paymentLink = paymentLinkFixture({ id: 'pl_busy' })
    render(<PlanCard paymentLink={paymentLink} isBusy onSelect={jest.fn()} />)

    const cta = screen.getByTestId('billing-plan-cta-pl_busy')
    expect(cta).toBeDisabled()
    expect(cta).toHaveTextContent('Redirecting…')
  })

  it('shows a placeholder price when none can be determined', () => {
    const paymentLink = paymentLinkFixture({ metadata: { planName: 'Free' }, lineItems: [] })
    render(<PlanCard paymentLink={paymentLink} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
