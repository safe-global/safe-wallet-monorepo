import { fireEvent, render, screen } from '@/tests/test-utils'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import TrialEndingModal, { _endsIn } from '../TrialEndingModal'

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
jest.mock('@/services/local-storage/session', () => ({
  __esModule: true,
  ...jest.requireActual('@/services/local-storage/session'),
  sessionItem: (key: string) => ({
    get: () => (storage[key] ? JSON.parse(storage[key]) : undefined),
    set: (value: unknown) => {
      storage[key] = JSON.stringify(value)
    },
    remove: () => {
      delete storage[key]
    },
  }),
}))
jest.mock('../../SafeProModals', () => ({
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
}))
jest.mock('../ChangePlanFlow', () => ({
  __esModule: true,
  default: ({
    pick,
    currentPlan,
    onClose,
    onChanged,
  }: {
    pick: { tier: { name: string } }
    currentPlan: { isTrialing: boolean }
    onClose: () => void
    onChanged?: () => void
  }) => (
    <div data-testid="change-plan-dialog" data-to={pick.tier.name} data-trial={String(currentPlan.isTrialing)}>
      <button onClick={onChanged}>plan-changed</button>
      <button onClick={onClose}>flow-closed</button>
    </div>
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
    expect(_endsIn(7)).toBe('in 7 days')
    expect(_endsIn(1)).toBe('in 1 day')
    expect(_endsIn(0)).toBe('today')
  })

  it('stays dismissed for the rest of the trial once the last-week reminder was closed', () => {
    const { unmount } = render(<TrialEndingModal spaceId={SPACE_ID} />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue without Safe Pro' }))
    expect(storage.safeProTrialReminderSeen).toBe(JSON.stringify({ [SPACE_ID]: true }))
    unmount()

    for (const daysLeft of [5, 2, 1]) {
      mockUseSpacePlan.mockReturnValue(trial(daysLeft))
      const { container, unmount: unmountAgain } = render(<TrialEndingModal spaceId={SPACE_ID} />)
      expect(container).toBeEmptyDOMElement()
      unmountAgain()
    }
  })

  it('stays quiet when a payment method is already on file', () => {
    mockUseSpacePlan.mockReturnValue({ ...trial(7), hasPaymentMethod: true })
    render(<TrialEndingModal spaceId={SPACE_ID} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays quiet while the trial has more than a week left', () => {
    mockUseSpacePlan.mockReturnValue(trial(14))

    expect(render(<TrialEndingModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()
  })

  it('lets an admin add billing details, switch to Starter or continue without Safe Pro, once per Workspace', () => {
    const { unmount } = render(<TrialEndingModal spaceId={SPACE_ID} />)

    expect(screen.getByRole('heading', { name: 'Your free access will end in 7 days' })).toBeInTheDocument()
    expect(screen.getByText(/add a payment method by Dec 5, 2026, your Workspace will be locked/)).toBeInTheDocument()
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument()
    expect(screen.getByText('Need more than 20?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to sales/ })).toHaveAttribute('href', SUPPORT_CHAT_URL)

    fireEvent.click(screen.getByRole('button', { name: 'Add payment method' }))
    expect(mockOpenPortal).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-to', 'Starter')
    expect(screen.getByTestId('change-plan-dialog')).toHaveAttribute('data-trial', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Continue without Safe Pro' }))
    expect(screen.queryByRole('heading', { name: 'Your free access will end in 7 days' })).not.toBeInTheDocument()
    unmount()

    expect(render(<TrialEndingModal spaceId={SPACE_ID} />).container).toBeEmptyDOMElement()
  })

  it('closes the reminder for good once the plan changed', () => {
    render(<TrialEndingModal spaceId={SPACE_ID} />)

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Starter' }))
    fireEvent.click(screen.getByText('plan-changed'))

    expect(screen.queryByRole('heading', { name: 'Your free access will end in 7 days' })).not.toBeInTheDocument()
    expect(screen.getByTestId('change-plan-dialog')).toBeInTheDocument()
    expect(storage.safeProTrialReminderSeen).toBeUndefined()

    fireEvent.click(screen.getByText('flow-closed'))

    expect(screen.queryByTestId('change-plan-dialog')).not.toBeInTheDocument()
    expect(storage.safeProTrialReminderSeen).toBe(JSON.stringify({ [SPACE_ID]: true }))
  })

  it('shows a member the same plans without buttons, naming the Workspace and who can act', () => {
    mockUseIsAdmin.mockReturnValue(false)
    render(<TrialEndingModal spaceId={SPACE_ID} />)

    expect(screen.getByRole('heading', { name: 'Your free access will end in 7 days' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Acme Inc will be locked on Dec 5, 2026 unless an admin chooses a plan and adds a payment method.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Switch to Starter' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add payment method' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue without Safe Pro' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('heading', { name: 'Your free access will end in 7 days' })).not.toBeInTheDocument()
    expect(storage.safeProTrialReminderSeen).toBe(JSON.stringify({ [SPACE_ID]: true }))
  })
})
