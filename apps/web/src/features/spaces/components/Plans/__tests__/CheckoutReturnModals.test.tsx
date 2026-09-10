import { fireEvent, render, screen } from '@/tests/test-utils'
import CheckoutReturnModals from '../CheckoutReturnModals'

const mockUseSpacePlan = jest.fn()
const mockUseCheckoutReturn = jest.fn()
jest.mock('../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../hooks/billing/useCheckoutReturn', () => ({
  useCheckoutReturn: (spaceId?: string) => mockUseCheckoutReturn(spaceId),
}))
jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    SafeProTrialActivatedModal: ({
      open,
      onOpenChange,
      trialEndsAt,
      ctaLabel,
    }: {
      open: boolean
      onOpenChange: (o: boolean) => void
      trialEndsAt: number
      ctaLabel?: string
    }) =>
      open ? (
        <button data-testid="trial-activated-modal" data-ends={trialEndsAt} onClick={() => onOpenChange(false)}>
          {ctaLabel ?? 'Go to Workspace'}
        </button>
      ) : null,
    SafeProSubscriptionActivatedModal: ({ open, planName }: { open: boolean; planName: string }) =>
      open ? <div data-testid="subscription-activated-modal">{planName}</div> : null,
  }),
  createFeatureHandle: () => ({}),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const dismiss = jest.fn()
const refetch = jest.fn()
const subscription = (status: string) => ({ status, plan: { name: 'Business', currentPrice: 499, currency: 'eur' } })

describe('CheckoutReturnModals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpacePlan.mockReturnValue({ plan: { periodEndsAt: '2026-12-06T00:00:00Z' }, refetch })
    mockUseCheckoutReturn.mockReturnValue({ status: 'complete', subscription: subscription('trialing'), dismiss })
  })

  it('opens the trial confirmation for a trial subscription, refreshes the plan and dismisses on close', () => {
    render(<CheckoutReturnModals spaceId={SPACE_ID} trialCtaLabel="Continue" />)

    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseCheckoutReturn).toHaveBeenCalledWith(SPACE_ID)
    expect(refetch).toHaveBeenCalled()
    expect(screen.getByTestId('trial-activated-modal')).toHaveAttribute('data-ends', String(Date.UTC(2026, 11, 6)))
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('trial-activated-modal'))
    expect(dismiss).toHaveBeenCalled()
  })

  it('opens the subscription confirmation for a paid subscription', () => {
    mockUseCheckoutReturn.mockReturnValue({ status: 'complete', subscription: subscription('active'), dismiss })
    render(<CheckoutReturnModals />)

    expect(screen.getByTestId('subscription-activated-modal')).toHaveTextContent('Business')
    expect(screen.queryByTestId('trial-activated-modal')).not.toBeInTheDocument()
  })

  it.each(['idle', 'processing', 'activating', 'timeout', 'error'])(
    'renders nothing while the return is %s',
    (status) => {
      mockUseCheckoutReturn.mockReturnValue({ status, subscription: undefined, dismiss })
      const { container } = render(<CheckoutReturnModals />)

      expect(container).toBeEmptyDOMElement()
      expect(refetch).not.toHaveBeenCalled()
    },
  )
})
