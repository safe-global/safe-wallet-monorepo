import { fireEvent, render, screen } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import PlanChooserModal, { chooserCopy } from '../PlanChooserModal'

const mockUseSpaceOffers = jest.fn()
const mockStartCheckout = jest.fn()
const mockOpenPortal = jest.fn()
let mockCheckoutState: Record<string, unknown> = {}

jest.mock('../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId),
}))
jest.mock('../../../hooks/billing/useStartCheckout', () => ({
  useStartCheckout: (spaceId?: string) => ({
    startCheckout: (paymentLinkId: string) => mockStartCheckout(spaceId, paymentLinkId),
    isRedirecting: false,
    isError: false,
    ...mockCheckoutState,
  }),
}))
jest.mock('../../../hooks/billing/useBillingPortal', () => ({
  useBillingPortal: () => ({ openPortal: mockOpenPortal, isRedirecting: false }),
}))

const offer = (planName: string, paymentLinkId: string, seats: number, price: number) => ({
  paymentLinkId,
  priceId: `price_${paymentLinkId}`,
  planName,
  seats,
  price,
  currency: 'eur',
  billingCycle: 'month',
  trialPeriodDays: null,
})
const PLANS = [
  { name: 'Starter', offers: [offer('Starter', 'pl_starter', 2, 149)] },
  { name: 'Business', offers: [offer('Business', 'pl_business', 20, 499)] },
]
const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const ENDED_AT = Date.UTC(2026, 11, 5, 12)

describe('PlanChooserModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckoutState = {}
    mockUseSpaceOffers.mockReturnValue({ paidPlans: PLANS, isLoading: false })
  })

  it('words the headline by lock reason', () => {
    expect(chooserCopy('lapsed', ENDED_AT).title).toBe('Your free trial ended on Dec 5, 2026')
    expect(chooserCopy('lapsed', null).title).toBe('Your Workspace has no active plan')
    expect(chooserCopy('payment-failed', null).title).toBe('Your last payment failed')
  })

  it('offers Starter and Business, leads with Business, and points large needs to sales', () => {
    const onBack = jest.fn()
    render(<PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={ENDED_AT} onBack={onBack} />)

    expect(screen.getByRole('heading', { name: 'Your free trial ended on Dec 5, 2026' })).toBeInTheDocument()
    expect(screen.getByText(/everything is exactly as you left it/)).toBeInTheDocument()
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(screen.getByText('Need more than 20?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to sales/ })).toHaveAttribute('href', SUPPORT_CHAT_URL)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, 'pl_starter')

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Business' }))
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, 'pl_business')

    fireEvent.click(screen.getByRole('button', { name: 'Back to My accounts' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('can be dismissed only when given a dismiss handler', () => {
    const onDismiss = jest.fn()
    render(
      <PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={null} onBack={jest.fn()} onDismiss={onDismiss} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('sends a failed payment to the billing portal instead of the catalog', () => {
    render(<PlanChooserModal spaceId={SPACE_ID} reason="payment-failed" endedAt={null} onBack={jest.fn()} />)

    expect(screen.queryByRole('button', { name: 'Continue with Business' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Update billing details/ }))
    expect(mockOpenPortal).toHaveBeenCalled()
  })

  it('shows a skeleton while loading, an empty state without plans and a checkout error', () => {
    mockUseSpaceOffers.mockReturnValue({ paidPlans: [], isLoading: true })
    const { rerender } = render(
      <PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={null} onBack={jest.fn()} />,
    )
    expect(screen.getByTestId('plan-chooser-skeleton')).toBeInTheDocument()

    mockUseSpaceOffers.mockReturnValue({ paidPlans: [], isLoading: false })
    mockCheckoutState = { isError: true }
    rerender(<PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={null} onBack={jest.fn()} />)
    expect(screen.getByText('There is no plan available for this Workspace right now.')).toBeInTheDocument()
    expect(screen.getByText('We couldn’t start the checkout. Please try again.')).toBeInTheDocument()
  })
})
