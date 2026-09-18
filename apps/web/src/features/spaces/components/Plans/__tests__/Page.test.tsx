import { fireEvent, render, screen } from '@/tests/test-utils'
import SpacePlansPage from '../Page'

const mockUseSpacePlan = jest.fn()
const mockUseSpaceOffers = jest.fn()
const mockUseChangePlan = jest.fn()
let mockIsAdmin = true
const mockStartCheckout = jest.fn()
const mockOpenPortal = jest.fn()

jest.mock('../../AuthState', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => true }))
jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))
jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({ SafeProAnnouncement: () => null }),
  createFeatureHandle: () => ({}),
}))
jest.mock('../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../hooks/useSpaceMembers', () => ({ useIsAdmin: () => mockIsAdmin }))
jest.mock('../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId),
}))
jest.mock('../../../hooks/billing/useChangePlan', () => ({
  useChangePlan: (spaceId?: string) => mockUseChangePlan(spaceId),
}))
jest.mock('../../../hooks/billing/useStartCheckout', () => ({
  useStartCheckout: () => ({ startCheckout: mockStartCheckout, isRedirecting: false }),
}))
jest.mock('../../../hooks/billing/useBillingPortal', () => ({
  useBillingPortal: () => ({ openPortal: mockOpenPortal, isRedirecting: false }),
}))
jest.mock('../ChangePlanFlow', () => ({
  __esModule: true,
  default: ({
    pick,
    currentPlan,
    onClose,
  }: {
    pick: { tier: { name: string }; option: { priceId: string } }
    currentPlan: { name: string; price: number; isTrialing: boolean }
    onClose: () => void
  }) => (
    <div
      data-testid="change-plan-dialog"
      data-to={pick.tier.name}
      data-price={pick.option.priceId}
      data-from={`${currentPlan.name}:${currentPlan.price}:${currentPlan.isTrialing}`}
    >
      <button onClick={onClose}>close-dialog</button>
    </div>
  ),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const offer = (planName: string, paymentLinkId: string, seats: number, price: number, cycle = 'month') => ({
  paymentLinkId,
  priceId: `price_${paymentLinkId}`,
  planName,
  seats,
  price,
  currency: 'eur',
  billingCycle: cycle,
  trialPeriodDays: null,
})
const STARTER = {
  name: 'Starter',
  offers: [offer('Starter', 'pl_starter_m', 2, 149), offer('Starter', 'pl_starter_y', 2, 1608, 'year')],
}
const BUSINESS = { name: 'Business', offers: [offer('Business', 'pl_business_m', 20, 499)] }

const subscription = (name: string, currentPrice: number, status: string) => ({
  id: 'sub_1',
  status,
  plan: {
    id: `price_${name}`,
    name,
    currentPrice,
    originalPrice: null,
    currency: 'eur',
    billingCycle: 'month',
    features: [],
  },
})

const onPlan = (name: string, price: number, status: 'active' | 'trialing') => {
  mockUseSpacePlan.mockReturnValue({
    plan: { name, status, periodEndsAt: '2026-12-06T00:00:00Z', daysLeft: 20 },
    seats: { used: 6, quota: 20 },
    sponsoredTxs: { used: 0, quota: 10 },
    subscription: subscription(name, price, status),
    status,
    isTrialing: status === 'trialing',
    isLoading: false,
  })
  mockUseChangePlan.mockReturnValue({ canChange: true })
}

describe('SpacePlansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAdmin = true
    mockUseSpaceOffers.mockReturnValue({ paidPlans: [STARTER], isLoading: false })
  })

  it('shows a member who is not an admin the plans without any button to act on them', () => {
    mockIsAdmin = false
    onPlan('Business', 499, 'active')
    render(<SpacePlansPage spaceId={SPACE_ID} />)

    expect(screen.getByTestId('current-plan-card')).toHaveTextContent('Business')
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Manage plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Switch to Starter' })).not.toBeInTheDocument()
  })

  it('lets a Business Workspace switch to Starter through the change-plan dialog, on either billing cycle', () => {
    onPlan('Business', 499, 'active')
    render(<SpacePlansPage spaceId={SPACE_ID} />)

    expect(mockUseChangePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(screen.getByTestId('current-plan-card')).toHaveTextContent('Business')
    expect(screen.getAllByRole('button', { name: 'Manage plan' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Continue with/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(mockStartCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-to', 'Starter')
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-price', 'price_pl_starter_m')
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-from', 'Business:499:false')

    fireEvent.click(screen.getByText('close-dialog'))
    expect(screen.queryByTestId('change-plan-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Yearly/ }))
    expect(screen.getByTestId('current-plan-card')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-price', 'price_pl_starter_y')
  })

  it('lets a Starter Workspace upgrade to Business through the same dialog', () => {
    onPlan('Starter', 149, 'active')
    mockUseSpaceOffers.mockReturnValue({ paidPlans: [BUSINESS], isLoading: false })
    render(<SpacePlansPage spaceId={SPACE_ID} />)

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Business' }))
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-to', 'Business')
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-from', 'Starter:149:false')
  })

  it('offers the switch during a trial too, and sends the current card to billing details', () => {
    onPlan('Business', 499, 'trialing')
    render(<SpacePlansPage spaceId={SPACE_ID} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add payment method' }))
    expect(mockOpenPortal).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-from', 'Business:499:true')
  })

  it('falls back to Stripe Checkout when the subscription cannot be changed in place', () => {
    mockUseSpacePlan.mockReturnValue({
      plan: null,
      seats: null,
      sponsoredTxs: null,
      subscription: undefined,
      status: 'none',
      isTrialing: false,
      isLoading: false,
    })
    mockUseChangePlan.mockReturnValue({ canChange: false })
    render(<SpacePlansPage spaceId={SPACE_ID} />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Starter' }))
    expect(mockStartCheckout).toHaveBeenCalledWith('pl_starter_m')
    expect(screen.queryByTestId('change-plan-dialog')).not.toBeInTheDocument()
  })
})
