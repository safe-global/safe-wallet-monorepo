import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { SAFE_PRO_PRICING_URL } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import ClaimTrialModal, { claimTitle } from '../ClaimTrialModal'

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
  trialPeriodDays: 30,
  copy: { subtitle: `${planName} subtitle` },
})
const STARTER = { name: 'Starter', offers: [offer('Starter', 'pl_starter', 2, 189)] }
const BUSINESS = {
  name: 'Business',
  offers: [offer('Business', 'pl_business_5', 5, 669), offer('Business', 'pl_business_20', 20, 1669)],
}
const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const LOGIN_ENTRY = { 'Entry Point': 'workspace_login' }

describe('claimTitle', () => {
  it('names the migrated 60-day grace and a regular trial', () => {
    expect(claimTitle(60)).toBe('Your Workspace moved to Safe Pro')
    expect(claimTitle(30)).toBe('Start your 30-day free access to Safe Pro')
    expect(claimTitle(null)).toBe('Start your free access to Safe Pro')
  })
})

describe('ClaimTrialModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCheckoutState = {}
    mockRemoveState = {}
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [BUSINESS, STARTER], trialPeriodDays: 30, isLoading: false })
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB'] } })
    mockRemoveSafes.mockResolvedValue({ data: undefined })
  })

  it('links to the plan comparison under the header', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByRole('link', { name: /Compare plans/ })).toHaveAttribute('href', SAFE_PRO_PRICING_URL)
  })

  it('opens on Starter, the smallest size, with its price struck through and the free period', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['2 Safes', '5 Safes', '20 Safes'])
    expect(screen.getByRole('tab', { name: '2 Safes' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro Starter')
    expect(screen.getByText(/Starter subtitle/)).toBeInTheDocument()
    expect(screen.getByTestId('trial-price')).toHaveTextContent('€189/mo Free for 30 days')
    expect(screen.getByText("No card needed. You won't be charged after the trial ends.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('switches title, features and price with the picked size and keeps one feature list', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    const rowCount = screen.getAllByRole('listitem').length
    expect(screen.getAllByTestId('feature-excluded')).toHaveLength(4)
    expect(screen.getByText('10 sponsored txs/month')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: '20 Safes' }))

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro Business')
    expect(screen.getByText(/Business subtitle/)).toBeInTheDocument()
    expect(screen.getByTestId('trial-price')).toHaveTextContent('€1,669/mo Free for 30 days')
    expect(screen.queryAllByTestId('feature-excluded')).toHaveLength(0)
    expect(screen.getByText('50 sponsored txs/month')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(rowCount)
  })

  it('goes straight to Stripe with the picked size when the Workspace fits it', () => {
    const onBack = jest.fn()
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={onBack} />)

    fireEvent.click(screen.getByRole('tab', { name: '5 Safes' }))
    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))

    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, undefined, 'pl_business_5')
    expect(mockRemoveSafes).not.toHaveBeenCalled()
    expect(screen.queryByTestId('select-accounts-step')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go to My accounts' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('tracks the offer, the claim and the dismissal with the entry point', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_VIEWED, {
      ...LOGIN_ENTRY,
      'Free Access Length': 30,
    })

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_CLAIM_CLICKED, LOGIN_ENTRY)

    fireEvent.click(screen.getByRole('button', { name: 'Go to My accounts' }))
    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_OFFER_DISMISSED, {
      ...LOGIN_ENTRY,
      'Dismiss Action': 'go_to_my_accounts',
    })
  })

  it('sends a brand-new Workspace back to the wizard step it came from', () => {
    mockSpaceSafes.mockReturnValue({ safes: {} })
    render(
      <ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} returnPathname="/welcome/select-safes" variant="new" />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))

    expect(trackEvent).toHaveBeenCalledWith(SAFE_PRO_EVENTS.FREE_ACCESS_CLAIM_CLICKED, {
      'Entry Point': 'create_workspace',
    })
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, '/welcome/select-safes', 'pl_starter')
  })

  it('removes the Safes left out of the picked size and then checks out', async () => {
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB', '0xC'] } })
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} returnPathname="/welcome/select-safes" />)

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    expect(mockStartCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-limit', '2')
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-plan', 'Starter')

    fireEvent.click(screen.getByText('step-back'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Safe Pro Starter')

    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))
    fireEvent.click(screen.getByText('step-continue'))

    await waitFor(() => expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, '/welcome/select-safes', 'pl_starter'))
    expect(mockRemoveSafes).toHaveBeenCalledWith({
      spaceId: SPACE_ID,
      deleteSpaceSafesDto: { safes: [{ chainId: '1', address: '0xB' }] },
    })
  })

  it('carries the picked size into the accounts step', () => {
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB', '0xC', '0xD', '0xE', '0xF'] } })
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    fireEvent.click(screen.getByRole('tab', { name: '5 Safes' }))
    fireEvent.click(screen.getByRole('button', { name: /Start free trial/ }))

    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-plan', 'Business')
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-limit', '5')
  })

  it('stays on the accounts step and shows the error when removing Safes fails', async () => {
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
    expect(screen.getByText('There is no free access available for this Workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start free trial/ })).toBeDisabled()
  })

  it('surfaces a checkout failure', () => {
    mockCheckoutState = { isError: true }
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByText('We couldn’t start the checkout. Please try again.')).toBeInTheDocument()
  })
})
