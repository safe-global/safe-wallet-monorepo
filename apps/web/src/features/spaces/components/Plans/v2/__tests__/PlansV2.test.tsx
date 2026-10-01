import { fireEvent, render, screen, within } from '@/tests/test-utils'
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

const offer = (planName: string, seats: number, cents: number): PlanOffer => ({
  paymentLinkId: `pl_${planName}_${seats}`,
  priceId: `price_${planName}_${seats}`,
  planName,
  seats,
  price: cents / 100,
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

  it.each([
    { reduce: false, behavior: 'smooth' },
    { reduce: true, behavior: 'auto' },
  ])(
    'opens the comparison from the link at the top, scrolling $behavior and moving focus there',
    ({ reduce, behavior }) => {
      mockMatchMedia(reduce)
      renderPlans()

      fireEvent.click(screen.getByRole('link', { name: /Compare all features/ }))

      expect(screen.getByRole('button', { name: /Compare all features/ })).toHaveAttribute('aria-expanded', 'true')
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior, block: 'start' })
      expect(screen.getByTestId('compare-features')).toHaveFocus()
      expectPlansClick(SAFE_PRO_PLANS_LABELS.compare_features)
    },
  )

  it('opens the Hypernative Guardian signup from the add-on row and tracks it', () => {
    renderPlans()
    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    const row = screen.getByRole('rowheader', { name: 'Hypernative Guardian' }).closest('tr') as HTMLElement
    fireEvent.click(within(row).getAllByRole('button', { name: 'Sold separately' })[1])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expectPlansClick(SAFE_PRO_PLANS_LABELS.discuss_add_on)
  })

  it('tracks the sales prompt at the end of the page', () => {
    renderPlans()

    fireEvent.click(within(screen.getByTestId('plans-sales-prompt')).getByRole('link', { name: 'Talk to sales' }))
    expectPlansClick(SAFE_PRO_PLANS_LABELS.sales_prompt)
  })

  it('keeps the add-on buttons for a member who is not an admin, without plan buttons', () => {
    renderPlans(true)
    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(screen.getAllByRole('button', { name: 'Sold separately' })).toHaveLength(3)
    expect(screen.queryByRole('link', { name: 'Talk to sales' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('plans-sales-prompt')).not.toBeInTheDocument()
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
})
