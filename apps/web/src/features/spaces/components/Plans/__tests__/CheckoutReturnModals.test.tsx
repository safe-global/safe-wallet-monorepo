import { fireEvent, render, screen } from '@/tests/test-utils'
import CheckoutReturnModals from '../CheckoutReturnModals'

const mockPush = jest.fn()
jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush }) }))

const mockUseSpacePlan = jest.fn()
const mockUseCheckoutReturn = jest.fn()
jest.mock('../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../hooks/billing/useCheckoutReturn', () => ({
  useCheckoutReturn: (spaceId?: string) => mockUseCheckoutReturn(spaceId),
}))
jest.mock('../../SafeProModals', () => ({
  SafeProTrialActivatedModal: ({
    open,
    onOpenChange,
    trialEndsAt,
    ctaLabel,
    hasPaymentMethod,
  }: {
    open: boolean
    onOpenChange: (o: boolean) => void
    trialEndsAt: number | null
    ctaLabel?: string
    hasPaymentMethod?: boolean
  }) =>
    open ? (
      <button
        data-testid="trial-activated-modal"
        data-ends={trialEndsAt}
        data-has-payment-method={hasPaymentMethod}
        onClick={() => onOpenChange(false)}
      >
        {ctaLabel ?? 'Go to Workspace'}
      </button>
    ) : null,
  SafeProSubscriptionActivatedModal: ({ open, planName }: { open: boolean; planName: string }) =>
    open ? <div data-testid="subscription-activated-modal">{planName}</div> : null,
  SafeProPendingModal: ({ title }: { title: string }) => <div data-testid="checkout-pending">{title}</div>,
  SafeProNoticeModal: ({
    title,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
  }: {
    title: string
    actionLabel: string
    onAction: () => void
    secondaryActionLabel?: string
    onSecondaryAction?: () => void
  }) => (
    <div data-testid="checkout-failed">
      {title}
      <button onClick={onAction}>{actionLabel}</button>
      {secondaryActionLabel && <button onClick={onSecondaryAction}>{secondaryActionLabel}</button>}
    </div>
  ),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const dismiss = jest.fn()
const retry = jest.fn()
const refetch = jest.fn()
const subscription = (status: string) => ({
  status,
  plan: { id: 'price_1', currentPrice: 499, currency: 'eur' },
  metadata: { planName: 'Business' },
  currentPeriodEnd: Date.UTC(2026, 10, 14) / 1000,
})

describe('CheckoutReturnModals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpacePlan.mockReturnValue({ plan: null, refetch })
    mockUseCheckoutReturn.mockReturnValue({
      status: 'complete',
      subscription: subscription('trialing'),
      dismiss,
      retry,
    })
  })

  it('opens the trial confirmation for a trial subscription, refreshes the plan and dismisses on close', () => {
    render(<CheckoutReturnModals spaceId={SPACE_ID} trialCtaLabel="Continue" />)

    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseCheckoutReturn).toHaveBeenCalledWith(SPACE_ID)
    expect(refetch).toHaveBeenCalled()
    expect(screen.getByTestId('trial-activated-modal')).toHaveAttribute('data-ends', String(Date.UTC(2026, 10, 14)))
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByTestId('trial-activated-modal')).toHaveAttribute('data-has-payment-method', 'false')

    fireEvent.click(screen.getByTestId('trial-activated-modal'))
    expect(dismiss).toHaveBeenCalled()
  })

  it('passes no trial end when neither the subscription nor the plan has one, instead of the epoch', () => {
    mockUseCheckoutReturn.mockReturnValue({
      status: 'complete',
      subscription: { ...subscription('trialing'), currentPeriodEnd: null },
      dismiss,
      retry,
    })
    render(<CheckoutReturnModals spaceId={SPACE_ID} />)

    expect(screen.getByTestId('trial-activated-modal')).not.toHaveAttribute('data-ends')
  })

  it('tells the trial confirmation when checkout already stored a payment method', () => {
    mockUseCheckoutReturn.mockReturnValue({
      status: 'complete',
      subscription: { ...subscription('trialing'), hasPaymentMethod: true },
      dismiss,
      retry,
    })
    render(<CheckoutReturnModals spaceId={SPACE_ID} />)

    expect(screen.getByTestId('trial-activated-modal')).toHaveAttribute('data-has-payment-method', 'true')
  })

  it('opens the subscription confirmation for a paid subscription', () => {
    mockUseCheckoutReturn.mockReturnValue({ status: 'complete', subscription: subscription('active'), dismiss, retry })
    render(<CheckoutReturnModals />)

    expect(screen.getByTestId('subscription-activated-modal')).toHaveTextContent('Business')
    expect(screen.queryByTestId('trial-activated-modal')).not.toBeInTheDocument()
  })

  it('renders nothing when the user did not come back from Stripe', () => {
    mockUseCheckoutReturn.mockReturnValue({ status: 'idle', subscription: undefined, dismiss, retry })
    const { container } = render(<CheckoutReturnModals />)

    expect(container).toBeEmptyDOMElement()
    expect(refetch).not.toHaveBeenCalled()
  })

  it.each(['processing', 'activating'])('blocks the screen with a loader while the return is %s', (status) => {
    mockUseCheckoutReturn.mockReturnValue({ status, subscription: undefined, dismiss, retry })
    render(<CheckoutReturnModals />)

    expect(screen.getByTestId('checkout-pending')).toHaveTextContent('Confirming your subscription')
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(refetch).not.toHaveBeenCalled()
  })

  it('offers a retry when the subscription never propagates', () => {
    mockUseCheckoutReturn.mockReturnValue({ status: 'timeout', subscription: undefined, dismiss, retry })
    render(<CheckoutReturnModals />)

    expect(screen.getByTestId('checkout-failed')).toHaveTextContent('taking longer than expected')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(mockPush).toHaveBeenCalledWith('/welcome/spaces')
    expect(dismiss).not.toHaveBeenCalled()
  })

  it('reports a failed session without a retry', () => {
    mockUseCheckoutReturn.mockReturnValue({ status: 'error', subscription: undefined, dismiss, retry })
    render(<CheckoutReturnModals />)

    expect(screen.getByTestId('checkout-failed')).toHaveTextContent('We couldn’t confirm your checkout')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })
})
