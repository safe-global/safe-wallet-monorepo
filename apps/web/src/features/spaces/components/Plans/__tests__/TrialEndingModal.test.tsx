import { fireEvent, render, screen } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import TrialEndingModal, { endsIn } from '../TrialEndingModal'

const mockUseSpacePlan = jest.fn()
const mockUseSpaceOffers = jest.fn()
const mockUseIsAdmin = jest.fn()
const mockOpenPortal = jest.fn()
const storage: Record<string, string> = {}

jest.mock('../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId),
}))
jest.mock('../../../hooks/billing/useBillingPortal', () => ({
  useBillingPortal: () => ({ openPortal: mockOpenPortal, isRedirecting: false }),
}))
jest.mock('../../../hooks/useSpaceMembers', () => ({
  useCurrentMembership: () => ({ id: 1 }),
  useIsAdmin: (spaceId?: string) => mockUseIsAdmin(spaceId),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => ({ currentData: { name: 'Acme Inc' } }),
}))
jest.mock('@/services/local-storage/local', () => ({
  __esModule: true,
  ...jest.requireActual('@/services/local-storage/local'),
  localItem: (key: string) => ({
    get: () => (storage[key] ? JSON.parse(storage[key]) : undefined),
    set: (value: unknown) => {
      storage[key] = JSON.stringify(value)
    },
  }),
}))
jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    SafeProNoticeModal: ({
      title,
      body,
      actionLabel,
      onAction,
    }: {
      title: string
      body: string
      actionLabel: string
      onAction: () => void
    }) => (
      <div data-testid="notice-modal">
        <h2>{title}</h2>
        <p>{body}</p>
        <button onClick={onAction}>{actionLabel}</button>
      </div>
    ),
  }),
  createFeatureHandle: () => ({}),
}))
jest.mock('../ChangePlanDialog', () => ({
  __esModule: true,
  default: ({ pick, currentPlan }: { pick: { tier: { name: string } }; currentPlan: { isTrialing: boolean } }) => (
    <div data-testid="change-plan-dialog" data-to={pick.tier.name} data-trial={String(currentPlan.isTrialing)} />
  ),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
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
const STARTER = { name: 'Starter', offers: [offer('Starter', 'pl_starter', 2, 149)] }
const subscription = {
  id: 'sub_1',
  status: 'trialing',
  plan: {
    id: 'price_business',
    name: 'Business',
    currentPrice: 499,
    originalPrice: null,
    currency: 'eur',
    billingCycle: 'month',
    features: [],
  },
}

const trial = (daysLeft: number, isTrialEndingSoon = daysLeft <= 7) => ({
  plan: { name: 'Business', status: 'trialing', periodEndsAt: '2026-12-05T00:00:00Z', daysLeft },
  seats: { used: 6, quota: 20 },
  subscription,
  status: 'trialing',
  isTrialing: true,
  isTrialEndingSoon,
  isLoading: false,
})

describe('TrialEndingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of Object.keys(storage)) delete storage[key]
    mockUseSpacePlan.mockReturnValue(trial(7))
    mockUseSpaceOffers.mockReturnValue({ paidPlans: [STARTER], isLoading: false })
    mockUseIsAdmin.mockReturnValue(true)
  })

  it('words the countdown', () => {
    expect(endsIn(7)).toBe('in 7 days')
    expect(endsIn(1)).toBe('in 1 day')
    expect(endsIn(0)).toBe('today')
  })

  it('stays quiet while the trial has more than a week left', () => {
    mockUseSpacePlan.mockReturnValue(trial(14))

    expect(render(<TrialEndingModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()
  })

  it('lets an admin add billing details, switch to Starter or continue without Safe Pro, once per Workspace', () => {
    const { unmount } = render(<TrialEndingModal spaceId={SPACE_ID} />)

    expect(screen.getByRole('heading', { name: 'Your free trial will end in 7 days' })).toBeInTheDocument()
    expect(screen.getByText(/add billing details by Dec 5, 2026, your Workspace will be locked/)).toBeInTheDocument()
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    expect(screen.getByText('Need more than 20?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to sales/ })).toHaveAttribute('href', SUPPORT_CHAT_URL)

    fireEvent.click(screen.getByRole('button', { name: 'Add payment method' }))
    expect(mockOpenPortal).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-to', 'Starter')
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-trial', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Continue without Safe Pro' }))
    expect(screen.queryByRole('heading', { name: 'Your free trial will end in 7 days' })).not.toBeInTheDocument()
    unmount()

    expect(render(<TrialEndingModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()
  })

  it('only warns a member, naming the Workspace and the lock date', () => {
    mockUseIsAdmin.mockReturnValue(false)
    render(<TrialEndingModal spaceId={SPACE_ID} />)

    expect(screen.getByTestId('notice-modal')).toHaveTextContent('Your free trial will end in 7 days')
    expect(screen.getByTestId('notice-modal')).toHaveTextContent(
      'Acme Inc will be locked on Dec 5, 2026 unless an admin chooses a plan and adds billing details.',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByTestId('notice-modal')).not.toBeInTheDocument()
    expect(storage[`safeProTrialReminderSeen:${SPACE_ID}`]).toBe('true')
  })
})
