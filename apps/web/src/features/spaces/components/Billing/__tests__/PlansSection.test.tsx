import { render, screen, fireEvent, within } from '@/tests/test-utils'
import PlansSection from '../sections/PlansSection'
import { BillingDataProvider } from '../BillingDataContext'
import { createStarterBillingState } from '../mocks'

const renderSection = () =>
  render(
    <BillingDataProvider value={createStarterBillingState()}>
      <PlansSection />
    </BillingDataProvider>,
  )

describe('PlansSection', () => {
  it('renders the heading, compare link and one card per plan group', () => {
    renderSection()

    expect(screen.getByRole('heading', { name: 'Plans' })).toBeInTheDocument()
    expect(screen.getByText('Compare all features')).toBeInTheDocument()
    expect(screen.getByTestId('billing-plan-card-starter')).toBeInTheDocument()
    expect(screen.getByTestId('billing-plan-card-pro')).toBeInTheDocument()
    expect(screen.getByTestId('billing-plan-card-business')).toBeInTheDocument()
  })

  it('applies the -10% yearly discount when switching billing period', () => {
    renderSection()

    const proCard = screen.getByTestId('billing-plan-card-pro')
    expect(within(proCard).getByText('$49')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Yearly/ }))

    // 49 * 0.9 = 44.1 → rounded to 44
    expect(within(proCard).getByText('$44')).toBeInTheDocument()
  })

  it('switches the displayed price when selecting a different tier', () => {
    renderSection()

    const proCard = screen.getByTestId('billing-plan-card-pro')
    expect(within(proCard).getByText('$49')).toBeInTheDocument()

    fireEvent.click(within(proCard).getByRole('button', { name: 'Pro+' }))

    expect(within(proCard).getByText('$99')).toBeInTheDocument()
  })

  it('renders the current plan CTA as non-actionable and upgrade CTAs as buttons', () => {
    renderSection()

    // Starter is the current plan → plain label, not a button CTA.
    expect(screen.queryByTestId('billing-plan-cta-starter')).not.toBeInTheDocument()
    expect(screen.getByTestId('billing-plan-cta-pro')).toBeInTheDocument()
    expect(screen.getByTestId('billing-plan-cta-business')).toBeInTheDocument()
  })
})
