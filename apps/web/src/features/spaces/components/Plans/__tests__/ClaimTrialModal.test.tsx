import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import ClaimTrialModal from '../ClaimTrialModal'

const mockUseSpaceOffers = jest.fn()
const mockStartCheckout = jest.fn()
const mockRemoveSafes = jest.fn()
const mockSpaceSafes = jest.fn()
let mockCheckoutState: Record<string, unknown> = {}
let mockRemoveState: Record<string, unknown> = {}

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))
jest.mock('../../../hooks/billing/useSpaceOffers', () => ({
  useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId),
}))
jest.mock('../../../hooks/billing/useStartCheckout', () => ({
  useStartCheckout: (spaceId?: string, returnPathname?: string) => ({
    startCheckout: (paymentLinkId: string) => mockStartCheckout(spaceId, returnPathname, paymentLinkId),
    isRedirecting: false,
    isError: false,
    ...mockCheckoutState,
  }),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: () => ({ currentData: mockSpaceSafes() }),
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafes, { isLoading: false, error: undefined, ...mockRemoveState }],
}))
jest.mock('../SelectAccountsStep', () => ({
  __esModule: true,
  default: ({
    limit,
    planName,
    onBack,
    onContinue,
    error,
  }: {
    limit: number
    planName: string
    onBack: () => void
    onContinue: (removed: Array<{ chainId: string; address: string }>) => void
    error?: string
  }) => (
    <div data-testid="select-accounts-step" data-limit={limit} data-plan={planName}>
      {error}
      <button onClick={onBack}>step-back</button>
      <button onClick={() => onContinue([{ chainId: '1', address: '0xB' }])}>step-continue</button>
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
  trialPeriodDays: 60,
})
const BUSINESS = {
  name: 'Business',
  offers: [{ ...offer('Business', 'pl_business', 20, 499), features: ['Policy engine'] }],
}
const STARTER = { name: 'Starter', offers: [offer('Starter', 'pl_starter', 2, 149)] }
const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const LOGIN_ENTRY = { 'Entry Point': 'workspace_login' }

describe('ClaimTrialModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckoutState = {}
    mockRemoveState = {}
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [BUSINESS], trialPeriodDays: 60, isLoading: false })
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB'] } })
    mockRemoveSafes.mockResolvedValue({ data: undefined })
    jest.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 9, 6, 12))
  })

  afterEach(() => jest.restoreAllMocks())

  it('names the trial length and explains the longer trial of a migrated Workspace', () => {
    const { rerender } = render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro 60-day free trial')
    expect(screen.getByText(/60 days instead of 30/)).toBeInTheDocument()

    mockUseSpaceOffers.mockReturnValue({ trialPlans: [BUSINESS], trialPeriodDays: 30, isLoading: false })
    rerender(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro 30-day free trial')
    expect(screen.queryByText(/60 days instead of 30/)).not.toBeInTheDocument()
  })

  it('lists the trial features without a price and says when the trial ends', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByTestId('trial-features')).toHaveTextContent('Policy engine')
    expect(screen.queryByText(/€499/)).not.toBeInTheDocument()
    expect(screen.getByText('No card. No charge. Trial ends on its own Dec 5, 2026.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see all features/ })).toHaveAttribute('href', SAFE_PRO_PRICING_URL)
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('goes straight to Stripe when the Workspace fits the seats, and goes back on request', () => {
    const onBack = jest.fn()
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: 'Go to My accounts' }))
    expect(onBack).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, undefined, 'pl_business')
    expect(mockRemoveSafes).not.toHaveBeenCalled()
    expect(screen.queryByTestId('select-accounts-step')).not.toBeInTheDocument()
  })

  it('starts the trial on Business when several plans are offered', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [STARTER, BUSINESS], trialPeriodDays: 60, isLoading: false })
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, undefined, 'pl_business')
  })

  it('tracks the offer, the claim and the dismissal with the entry point', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_VIEWED, {
      ...LOGIN_ENTRY,
      'Free Access Length': 60,
    })

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_CLAIM_CLICKED, LOGIN_ENTRY)

    fireEvent.click(screen.getByRole('button', { name: 'Go to My accounts' }))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_DISMISSED, {
      ...LOGIN_ENTRY,
      'Dismiss Action': 'go_to_my_accounts',
    })
  })

  it('tracks a brand-new Workspace from the create flow and returns Stripe to the wizard', () => {
    mockSpaceSafes.mockReturnValue({ safes: {} })
    render(
      <ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} returnPathname="/welcome/select-safes" variant="new" />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_CLAIM_CLICKED, {
      'Entry Point': 'create_workspace',
    })
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, '/welcome/select-safes', 'pl_business')
  })

  it('removes the Safes left out of the trial plan and then checks out', async () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [STARTER], trialPeriodDays: 30, isLoading: false })
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB', '0xC'] } })
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} returnPathname="/welcome/select-safes" />)

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(mockStartCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-limit', '2')
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-plan', 'Starter')

    fireEvent.click(screen.getByText('step-back'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro 30-day free trial')

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    fireEvent.click(screen.getByText('step-continue'))

    await waitFor(() => expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, '/welcome/select-safes', 'pl_starter'))
    expect(mockRemoveSafes).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      deleteSpaceSafesDto: { safes: [{ chainId: '1', address: '0xB' }] },
    })
  })

  it('stays on the accounts step and shows the error when removing Safes fails', async () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [STARTER], trialPeriodDays: 30, isLoading: false })
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB', '0xC'] } })
    mockRemoveSafes.mockResolvedValue({ error: { status: 500, data: { message: 'Boom' } } })
    mockRemoveState = { error: { status: 500, data: { message: 'Boom' } } }
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    fireEvent.click(screen.getByText('step-continue'))

    await waitFor(() => expect(mockRemoveSafes).toHaveBeenCalled())
    expect(mockStartCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('select-accounts-step')).toHaveTextContent('Boom')
  })

  it('shows a skeleton while the offers load and an empty state without a trial', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [], trialPeriodDays: null, isLoading: true })
    const { rerender } = render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(screen.getByTestId('claim-trial-skeleton')).toBeInTheDocument()

    mockUseSpaceOffers.mockReturnValue({ trialPlans: [], trialPeriodDays: null, isLoading: false })
    rerender(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro free trial')
    expect(screen.getByText('There is no trial available for this Workspace.')).toBeInTheDocument()
    expect(screen.getByText('No card. No charge. Trial ends on its own.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start free trial/ })).toBeDisabled()
  })

  it('surfaces a checkout failure', () => {
    mockCheckoutState = { isError: true }
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByText('We couldn’t start the checkout. Please try again.')).toBeInTheDocument()
  })
})
