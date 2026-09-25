import { fireEvent, render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import PlanChooserModal, { chooserCopy, _LAPSED_DATA_NOTE } from '../PlanChooserModal'

const mockUseSpaceOffers = jest.fn()
const mockCheckout = jest.fn()
const mockNeedsTrim = jest.fn()
const mockOpenPortal = jest.fn()
let mockTrimState: Record<string, unknown> = {}

jest.mock('../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId),
}))
jest.mock('../../../hooks/billing/useSeatTrimCheckout', () => ({
  useSeatTrimCheckout: (spaceId: string) => ({
    seatCount: 3,
    needsTrim: (seats: number | null | undefined) => mockNeedsTrim(seats),
    checkout: (paymentLinkId: string, removed?: unknown[]) => mockCheckout(spaceId, paymentLinkId, removed),
    isBusy: false,
    error: undefined,
    ...mockTrimState,
  }),
}))
jest.mock('../../../hooks/billing/useBillingPortal', () => ({
  useBillingPortal: () => ({ openPortal: mockOpenPortal, isRedirecting: false }),
}))
jest.mock('../SelectAccountsStep', () => ({
  __esModule: true,
  default: ({
    title,
    limit,
    planName,
    onBack,
    onContinue,
  }: {
    title: string
    limit: number
    planName: string
    onBack: () => void
    onContinue: (removed: Array<{ chainId: string; address: string }>) => void
  }) => (
    <div data-testid="select-accounts-step" data-limit={limit} data-plan={planName}>
      {title}
      <button onClick={onBack}>step-back</button>
      <button onClick={() => onContinue([{ chainId: '1', address: '0xC' }])}>step-continue</button>
    </div>
  ),
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
    mockTrimState = {}
    mockUseSpaceOffers.mockReturnValue({ paidPlans: PLANS, isLoading: false })
    mockNeedsTrim.mockImplementation((seats: number | null | undefined) => seats != null && 3 > seats)
  })

  it('reassures a lapsed Workspace about charges and data in a tooltip next to the subtitle', async () => {
    const { user } = renderWithUserEvent(
      <PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={ENDED_AT} onBack={jest.fn()} />,
    )

    expect(screen.queryByText(/exportable for 90 days/)).not.toBeInTheDocument()
    await user.hover(screen.getByTestId('lapsed-data-note'))
    expect(await screen.findByText(_LAPSED_DATA_NOTE)).toBeInTheDocument()
  })

  it('keeps the data note off a failed-payment Workspace', () => {
    render(<PlanChooserModal spaceId={SPACE_ID} reason="payment-failed" endedAt={null} onBack={jest.fn()} />)

    expect(screen.queryByTestId('lapsed-data-note')).not.toBeInTheDocument()
  })

  it('words the headline by lock reason', () => {
    expect(chooserCopy('lapsed', ENDED_AT).title).toBe('Your Safe Pro free access ended on Dec 5, 2026')
    expect(chooserCopy('lapsed', null).title).toBe('Your Workspace has no active plan')
    expect(chooserCopy('payment-failed', null).title).toBe('Your last payment failed')
  })

  it('offers Starter and Business, leads with Business, and points large needs to sales', () => {
    const onBack = jest.fn()
    render(<PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={ENDED_AT} onBack={onBack} />)

    expect(screen.getByRole('heading', { name: 'Your Safe Pro free access ended on Dec 5, 2026' })).toBeInTheDocument()
    expect(screen.getByText('Choose a plan to unlock your Workspace.')).toBeInTheDocument()
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(screen.getByText('Need more than 20?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to sales/ })).toHaveAttribute('href', SUPPORT_CHAT_URL)

    fireEvent.click(screen.getByRole('button', { name: 'Back to My accounts' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('goes straight to Stripe when the picked plan covers the Workspace', () => {
    render(<PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={ENDED_AT} onBack={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Business' }))
    expect(mockCheckout).toHaveBeenCalledWith(SPACE_ID, 'pl_business', undefined)
    expect(screen.queryByTestId('select-accounts-step')).not.toBeInTheDocument()
  })

  it('asks which Safes stay when the picked plan covers fewer than the Workspace holds', () => {
    render(<PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={ENDED_AT} onBack={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(mockCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-limit', '2')
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-plan', 'Starter')
    expect(screen.getByTestId('select-accounts-step')).toHaveTextContent('Choose Safe accounts for your plan')
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()

    fireEvent.click(screen.getByText('step-back'))
    expect(screen.getByRole('heading', { name: 'Your Safe Pro free access ended on Dec 5, 2026' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    fireEvent.click(screen.getByText('step-continue'))
    expect(mockCheckout).toHaveBeenCalledWith(SPACE_ID, 'pl_starter', [{ chainId: '1', address: '0xC' }])
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
    mockTrimState = { error: 'We couldn’t start the checkout. Please try again.' }
    rerender(<PlanChooserModal spaceId={SPACE_ID} reason="lapsed" endedAt={null} onBack={jest.fn()} />)
    expect(screen.getByText('There is no plan available for this Workspace right now.')).toBeInTheDocument()
    expect(screen.getByText('We couldn’t start the checkout. Please try again.')).toBeInTheDocument()
  })
})
