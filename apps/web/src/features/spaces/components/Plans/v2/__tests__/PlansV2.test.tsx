import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS, SAFE_PRO_PLANS_LABELS } from '@/services/analytics/events/safe-pro'
import type { PlanGroup, PlanOffer } from '../../../../hooks/billing/types'
import { buildPlanTiers } from '../../planTiers'
import PlansV2 from '../PlansV2'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const expectPlansClick = (location: SAFE_PRO_PLANS_LABELS) =>
  expect(trackEvent).toHaveBeenCalledWith(
    { ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: location },
    { [MixpanelEventParams.LOCATION]: location },
  )

const offer = (planName: string, seats: number, amountMinor: number): PlanOffer => ({
  paymentLinkId: `pl_${planName}_${seats}`,
  priceId: `price_${planName}_${seats}`,
  planName,
  seats,
  price: amountMinor / 100,
  amountMinor,
  currency: 'eur',
  billingCycle: 'month',
  trialPeriodDays: null,
})
const PLANS: PlanGroup[] = [
  { name: 'Starter', offers: [offer('Starter', 2, 18_900)] },
  { name: 'Business', offers: [offer('Business', 20, 166_900)] },
]

const renderPlans = (readOnly = false) =>
  render(
    <PlansV2 plan={null} safeAccounts={null} sponsoredTxs={null} tiers={buildPlanTiers(PLANS)} readOnly={readOnly} />,
  )

const mockMatchMedia = (reduce: boolean) =>
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn().mockReturnValue({ matches: reduce }),
  })

describe('PlansV2', () => {
  const originalMatchMedia = window.matchMedia
  let scrollIntoView: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    scrollIntoView = jest.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
    mockMatchMedia(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: originalMatchMedia })
  })

  it('opens the comparison from the link at the top, scrolling to it smoothly and moving focus there', () => {
    renderPlans()

    fireEvent.click(screen.getByRole('link', { name: /Compare all features/ }))

    expect(screen.getByRole('button', { name: /Compare all features/ })).toHaveAttribute('aria-expanded', 'true')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(screen.getByTestId('compare-features')).toHaveFocus()
    expectPlansClick(SAFE_PRO_PLANS_LABELS.compare_features)
  })

  it('jumps without animation when the system asks for reduced motion', () => {
    mockMatchMedia(true)
    renderPlans()

    fireEvent.click(screen.getByRole('link', { name: /Compare all features/ }))

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('opens support in a new tab from the coming-soon and add-on cards, tracking each', () => {
    renderPlans()

    const requestUpdates = screen.getByRole('link', { name: 'Request updates' })
    const discussAddOn = screen.getByRole('link', { name: 'Discuss add-on' })
    ;[requestUpdates, discussAddOn].forEach((link) => {
      expect(link).toHaveAttribute('href', SUPPORT_CHAT_URL)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link.querySelector('[data-cta-arrow]')).toHaveAttribute('data-cta-arrow', 'reveal')
    })

    fireEvent.click(requestUpdates)
    fireEvent.click(discussAddOn)
    expectPlansClick(SAFE_PRO_PLANS_LABELS.request_updates)
    expectPlansClick(SAFE_PRO_PLANS_LABELS.discuss_add_on)
  })

  it('tracks Talk to sales on the Enterprise card', () => {
    renderPlans()

    fireEvent.click(screen.getByRole('link', { name: 'Talk to sales' }))

    expectPlansClick(SAFE_PRO_PLANS_LABELS.talk_to_sales)
  })

  it('keeps the support links for a member who is not an admin, without plan buttons', () => {
    renderPlans(true)

    expect(screen.getByRole('link', { name: 'Request updates' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Discuss add-on' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Talk to sales' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Continue with/ })).not.toBeInTheDocument()
  })

  it.each([
    { hasPaymentMethod: true, readOnly: false, shown: true },
    { hasPaymentMethod: false, readOnly: false, shown: false },
    { hasPaymentMethod: true, readOnly: true, shown: false },
  ])(
    'offers Manage plan in the status panel during a trial with a card on file ($hasPaymentMethod) unless read-only ($readOnly)',
    ({ hasPaymentMethod, readOnly, shown }) => {
      render(
        <PlansV2
          plan={{ name: 'Business', status: 'trialing', periodEndsAt: null, daysLeft: 20, hasPaymentMethod }}
          safeAccounts={null}
          sponsoredTxs={null}
          tiers={buildPlanTiers(PLANS)}
          canManage={false}
          readOnly={readOnly}
          currentPlan={{
            name: 'Business',
            price: 1669,
            currency: 'eur',
            billingCycle: 'month',
            isTrialing: true,
            hasPaymentMethod,
            periodEndsAt: null,
          }}
        />,
      )

      expect(screen.queryAllByRole('button', { name: 'Manage plan' })).toHaveLength(shown ? 1 : 0)
    },
  )

  it('marks the current tier as the current column of the comparison', () => {
    const tiers = buildPlanTiers(PLANS).map((tier) => (tier.name === 'Business' ? { ...tier, isCurrent: true } : tier))
    render(<PlansV2 plan={null} safeAccounts={null} sponsoredTxs={null} tiers={tiers} />)

    const header = screen.getByRole('columnheader', { name: /^Business/ })
    expect(within(header).getByText('Current')).toBeInTheDocument()
  })
})
