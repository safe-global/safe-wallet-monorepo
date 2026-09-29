import { fireEvent, render, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { ENTERPRISE_TIER, PLAN_CONTENT_V2 } from '../../planCatalog'
import type { PlanSeatOption, PlanTier } from '../../types'
import type { CurrentPlan } from '../../types'
import { PlanCardV2 } from '../PlanCardV2'
import { trackPlansV2Click } from '../trackPlansV2Click'

jest.mock('../trackPlansV2Click', () => ({ trackPlansV2Click: jest.fn() }))

const businessPlan = (overrides: Partial<CurrentPlan> = {}): CurrentPlan => ({
  name: 'Business',
  price: 1669,
  currency: 'eur',
  billingCycle: 'month',
  isTrialing: false,
  periodEndsAt: null,
  ...overrides,
})

const currentTier = (
  currentPriceId: string,
  options = [option(5, 66_900), option(10, 109_900), option(20, 166_900)],
) => ({
  ...BUSINESS,
  id: 'current',
  options,
  isCurrent: true,
  currentPriceId,
})

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
    PLAN_CONTENT_V2.Business.additionalFeatures.forEach((feature) =>
      expect(screen.getByText(feature)).toBeInTheDocument(),
    )
    expect(screen.queryByText('A Stripe selling point')).not.toBeInTheDocument()
  })

  it('shows the support level and what it includes', () => {
    render(<PlanCardV2 tier={BUSINESS} />)

    const support = screen.getByTestId('plan-support')
    expect(within(support).getByText('Support')).toBeInTheDocument()
    expect(within(support).getByText('Priority')).toBeInTheDocument()
    expect(within(support).getByText('+ Guided onboarding')).toBeInTheDocument()

    const highlight = within(support).getByTestId('plan-support-level').querySelector('span[aria-hidden]')
    expect(highlight).toHaveClass('scale-x-0', 'group-hover/plan:scale-x-100', 'bg-mint')
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

  it('keeps every card flat on the muted surface, lifting it to white with a shadow on hover', () => {
    const starter: PlanTier = { ...BUSINESS, id: 'Starter-month', name: 'Starter', options: [option(2, 18_900)] }
    render(
      <>
        <PlanCardV2 tier={starter} />
        <PlanCardV2 tier={BUSINESS} />
      </>,
    )

    const [starterCard, businessCard] = screen.getAllByTestId('plan-card')
    expect(starterCard).toHaveAttribute('data-variant', 'muted-secondary')
    expect(businessCard).toHaveAttribute('data-variant', 'muted-secondary')
    expect(businessCard).toHaveClass('hover:bg-card')
    expect(businessCard).toHaveClass('hover:shadow-hairline-lg')
    expect(businessCard).not.toHaveClass('shadow-hairline-lg')
    expect(businessCard).toHaveClass('group/plan')
    within(businessCard)
      .getAllByTestId('plan-feature-check')
      .forEach((check) => expect(check).toHaveClass('group-hover/plan:bg-foreground'))
    expect(
      within(businessCard)
        .getAllByTestId('plan-feature-check')
        .map((check) => check.style.getPropertyValue('--check-delay')),
    ).toEqual(PLAN_CONTENT_V2.Business.additionalFeatures.map((_, index) => `${index * 15}ms`))
  })

  it('gives only the Business card the filled button, whose arrow nudges while the others reveal one', () => {
    const starter: PlanTier = { ...BUSINESS, id: 'Starter-month', name: 'Starter', options: [option(2, 18_900)] }
    render(
      <>
        <PlanCardV2 tier={starter} />
        <PlanCardV2 tier={BUSINESS} />
      </>,
    )

    const [starterCard, businessCard] = screen.getAllByTestId('plan-card')
    expect(starterCard).not.toHaveAttribute('data-primary')
    expect(businessCard).toHaveAttribute('data-primary', 'true')
    const arrowOf = (card: HTMLElement, name: string) =>
      within(card).getByRole('button', { name }).querySelector('[data-cta-arrow]')
    expect(arrowOf(starterCard, 'Continue with Starter')).toHaveAttribute('data-cta-arrow', 'reveal')
    expect(arrowOf(businessCard, 'Continue with Business')).toHaveAttribute('data-cta-arrow', 'nudge')
  })

  it('greys out the plan in force, even on the Business card', () => {
    render(
      <PlanCardV2
        tier={{ ...BUSINESS, isCurrent: true, currentPriceId: 'price_b20m' }}
        currentPlan={{
          name: 'Business',
          price: 1669,
          currency: 'eur',
          billingCycle: 'month',
          isTrialing: false,
          periodEndsAt: null,
        }}
      />,
    )

    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Current plan' }).querySelector('[data-cta-arrow]')).toBeNull()
  })

  it('sends a trial without a payment method to billing, not to the change-plan flow', () => {
    const onManage = jest.fn()
    const onSubscribe = jest.fn()
    render(
      <PlanCardV2
        tier={currentTier('price_b20m')}
        currentPlan={businessPlan({ isTrialing: true })}
        onManage={onManage}
        onSubscribe={onSubscribe}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add payment method' }))

    expect(onManage).toHaveBeenCalledTimes(1)
    expect(onSubscribe).not.toHaveBeenCalled()
  })

  it('disables the plan button while a checkout or portal redirect is in flight', () => {
    render(<PlanCardV2 tier={BUSINESS} isBusy />)

    expect(screen.getByRole('button', { name: 'Continue with Business' })).toBeDisabled()
  })

  it('opens on the plan in force even when it is not the first Safe count', () => {
    render(<PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan({ price: 1099 })} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('10 Safe accounts')
    expect(screen.getByRole('button', { name: 'Current plan' })).toBeDisabled()
  })

  it('follows a subscription that lands after the card mounted', () => {
    const { rerender } = render(<PlanCardV2 tier={{ ...currentTier(''), currentPriceId: undefined }} />)
    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('5 Safe accounts')

    rerender(<PlanCardV2 tier={currentTier('price_b20m')} currentPlan={businessPlan()} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })

  it('keeps a picked Safe count when the page rebuilds the tiers', async () => {
    const { user, rerender } = renderWithUserEvent(
      <PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan({ price: 1099 })} />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Safe accounts for Business' })
    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
    await user.click(await screen.findByRole('option', { name: '20 Safe accounts' }))
    rerender(<PlanCardV2 tier={currentTier('price_b10m')} currentPlan={businessPlan({ price: 1099 })} />)

    expect(screen.getByRole('combobox', { name: 'Safe accounts for Business' })).toHaveTextContent('20 Safe accounts')
  })

  it('tracks the account-team link on a current Enterprise card', () => {
    render(
      <PlanCardV2
        tier={{ ...currentTier('price_b20m'), name: 'Enterprise' }}
        currentPlan={businessPlan({ name: 'Enterprise' })}
      />,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Change via your account team' }))

    expect(trackPlansV2Click).toHaveBeenCalledWith('account_team')
  })
})
