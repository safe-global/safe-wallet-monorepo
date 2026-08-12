import { render, screen } from '@/tests/test-utils'
import PlansSection from '../sections/PlansSection'
import { paymentLinkFixture, subscriptionFixture } from '../../../hooks/billing/testFixtures'

const mockStartCheckout = jest.fn()
const mockUsePaymentLinks = jest.fn()
const mockUseBillingSubscription = jest.fn()

jest.mock('@/features/spaces/hooks/billing/usePaymentLinks', () => ({
  usePaymentLinks: () => mockUsePaymentLinks(),
}))
jest.mock('@/features/spaces/hooks/billing/useBillingSubscription', () => ({
  useBillingSubscription: () => mockUseBillingSubscription(),
}))
jest.mock('@/features/spaces/hooks/billing/useCheckout', () => ({
  useCheckout: () => ({ startCheckout: mockStartCheckout, isRedirecting: false, error: false }),
}))

describe('PlansSection', () => {
  beforeEach(() => {
    mockUsePaymentLinks.mockReturnValue({ paymentLinks: [], isLoading: false })
    mockUseBillingSubscription.mockReturnValue({ subscription: undefined, isLoading: false })
  })

  it('renders one card per active payment link', () => {
    mockUsePaymentLinks.mockReturnValue({
      paymentLinks: [
        paymentLinkFixture({ id: 'pl_pro', metadata: { planName: 'Pro', planPrice: '49' } }),
        paymentLinkFixture({ id: 'pl_biz', metadata: { planName: 'Business', planPrice: '599' } }),
      ],
      isLoading: false,
    })
    render(<PlansSection />)

    expect(screen.getByTestId('billing-plan-card-pl_pro')).toBeInTheDocument()
    expect(screen.getByTestId('billing-plan-card-pl_biz')).toBeInTheDocument()
    expect(screen.getByText('Plans')).toBeInTheDocument()
  })

  it('marks the active subscription plan as current', () => {
    mockUsePaymentLinks.mockReturnValue({
      paymentLinks: [paymentLinkFixture({ id: 'pl_pro' })],
      isLoading: false,
    })
    mockUseBillingSubscription.mockReturnValue({
      subscription: subscriptionFixture({ plan: { id: 'pl_pro' } as never }),
      isLoading: false,
    })
    render(<PlansSection />)

    expect(screen.getByText('Current plan')).toBeInTheDocument()
    expect(screen.queryByTestId('billing-plan-cta-pl_pro')).not.toBeInTheDocument()
  })

  it('renders nothing when there are no payment links', () => {
    render(<PlansSection />)
    expect(screen.queryByTestId('billing-plans-section')).not.toBeInTheDocument()
  })
})
