import { fireEvent, render, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { ENTERPRISE_TIER, PLAN_CONTENT_V2 } from '../../planCatalog'
import type { PlanSeatOption, PlanTier } from '../../types'
import { PlanCardV2 } from '../PlanCardV2'

const option = (seats: number, amountMinor: number): PlanSeatOption => ({
  paymentLinkId: `pl_b${seats}m`,
  priceId: `price_b${seats}m`,
  label: `${seats} Safe accounts`,
  seats,
  price: amountMinor / 100,
  amountMinor,
  originalPrice: null,
})

const BUSINESS: PlanTier = {
  id: 'Business-month',
  name: 'Business',
  currency: 'eur',
  billingCycle: 'month',
  options: [option(20, 166_900), option(5, 66_900)],
  features: ['A Stripe selling point'],
}

describe('PlanCardV2', () => {
  it('shows who the plan is for, the per-Safe price and the amount charged', () => {
    render(<PlanCardV2 tier={BUSINESS} />)

    expect(screen.getByText(PLAN_CONTENT_V2.Business.description)).toBeInTheDocument()
    expect(screen.getByText('€83.45')).toBeInTheDocument()
    expect(screen.getByText('/Safe/mo')).toBeInTheDocument()
    expect(screen.getByTestId('plan-price-line')).toHaveTextContent('€1,669/mo billed monthly · excl. VAT')
  })

  it('lists only what the plan adds, under its heading, instead of the Stripe selling points', () => {
    render(<PlanCardV2 tier={BUSINESS} />)

    expect(screen.getByText(PLAN_CONTENT_V2.Business.featuresHeading)).toBeInTheDocument()
    PLAN_CONTENT_V2.Business.features.forEach((feature) => expect(screen.getByText(feature)).toBeInTheDocument())
    expect(screen.queryByText('A Stripe selling point')).not.toBeInTheDocument()
  })

  it('shows the support level and what it includes', () => {
    render(<PlanCardV2 tier={BUSINESS} />)

    const support = screen.getByTestId('plan-support')
    expect(within(support).getByText('Support')).toBeInTheDocument()
    expect(within(support).getByText('Priority')).toBeInTheDocument()
    expect(within(support).getByText('+ Guided onboarding')).toBeInTheDocument()
  })

  it('reprices the card when another Safe count is picked', async () => {
    const { user } = renderWithUserEvent(<PlanCardV2 tier={BUSINESS} />)

    const trigger = screen.getByRole('combobox', { name: 'Safe accounts for Business' })
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await user.click(await screen.findByRole('option', { name: '5 Safe accounts' }))

    expect(screen.getByText('€133.80')).toBeInTheDocument()
    expect(screen.getByTestId('plan-price-line')).toHaveTextContent('€669/mo billed monthly · excl. VAT')
  })

  it('carries no plan badge', () => {
    render(<PlanCardV2 tier={{ ...BUSINESS, isCurrent: true, currentPriceId: 'price_b20m' }} />)

    expect(screen.queryByText(/Free access|Active/)).not.toBeInTheDocument()
  })

  it('shows custom pricing and a sales link on the Enterprise card', () => {
    render(<PlanCardV2 tier={ENTERPRISE_TIER} />)

    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getByText('Annual term')).toBeInTheDocument()
    expect(screen.getByTestId('plan-price-line')).toHaveTextContent('Pricing by agreement · Billed annually')
    expect(screen.getByRole('link', { name: 'Talk to sales' })).toHaveAttribute('href', SUPPORT_CHAT_URL)
  })

  it('hands the picked offer to onSubscribe', () => {
    const onSubscribe = jest.fn()
    render(<PlanCardV2 tier={BUSINESS} onSubscribe={onSubscribe} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Business' }))

    expect(onSubscribe).toHaveBeenCalledWith({ tier: BUSINESS, option: BUSINESS.options[0] })
  })

  it('shows a member who is not an admin the price but no button', () => {
    render(<PlanCardV2 tier={BUSINESS} readOnly />)

    expect(screen.getByTestId('plan-price-line')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
