import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import ClaimTrialModal, { claimCopy, _freeLabel } from '../ClaimTrialModal'

const mockUseSpaceOffers = jest.fn()
const mockStartCheckout = jest.fn()
const mockRemoveSafes = jest.fn()
const mockSpaceSafes = jest.fn()
let mockCheckoutState: Record<string, unknown> = {}
let mockRemoveState: Record<string, unknown> = {}

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
const BUSINESS = { name: 'Business', offers: [offer('Business', 'pl_business', 20, 499)] }
const STARTER = { name: 'Starter', offers: [offer('Starter', 'pl_starter', 2, 149)] }
const SPACE_ID = '11111111-1111-1111-1111-111111111111'

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

  it('adapts the headline to the migrated 60-day grace and to a regular trial', () => {
    expect(claimCopy(60).title).toBe('Your Workspace moved to Safe Pro on Oct 6, 2026')
    expect(claimCopy(30)).toMatchObject({
      title: 'Start your 30-day free access to Safe Pro',
      subtitle: 'All Pro features unlocked. No billing details needed upfront.',
      note: "No payment method required. We'll remind you 7 days before your free access ends.",
      back: 'Go to My accounts',
      claim: 'Claim free access',
    })
    expect(claimCopy(null).title).toBe('Start your free access to Safe Pro')
    expect(claimCopy(60, 'new')).toEqual({
      title: 'Workspaces run on Safe Pro',
      subtitle: 'Your first 60 days are free.',
      note: "No payment method required. We'll remind you 7 days before your free access ends.",
      back: 'Go to My accounts',
      claim: 'Claim free access',
    })
  })

  it('tags the price as free, with the length of the free period for a brand-new Workspace', () => {
    expect(_freeLabel(60, 'existing')).toBe('Free')
    expect(_freeLabel(30, 'new')).toBe('30-day free')
    expect(_freeLabel(null, 'new')).toBe('Free')
  })

  it('links to the full feature comparison under the header', () => {
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByRole('link', { name: /Compare all features/ })).toHaveAttribute(
      'href',
      SAFE_PRO_ANNOUNCEMENT_URL,
    )
  })

  it('offers the Business trial and, when the Workspace fits the seats, goes straight to Stripe', () => {
    const onBack = jest.fn()
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={onBack} />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Your Workspace moved to Safe Pro on Oct 6, 2026',
    )
    expect(screen.getByText(/60 days instead of 30/)).toBeInTheDocument()
    expect(screen.getByTestId('trial-offer-Business')).toHaveTextContent('€499')
    expect(screen.getByTestId('trial-offer-Business')).toHaveTextContent('Free')
    expect(screen.getByText('Available until Dec 5, 2026.')).toBeInTheDocument()
    expect(screen.getByText('20 Safe accounts')).toBeInTheDocument()
    expect(screen.getByText('Policy engine')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go to My accounts' }))
    expect(onBack).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Claim free access/ }))
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, undefined, 'pl_business')
    expect(mockRemoveSafes).not.toHaveBeenCalled()
    expect(screen.queryByTestId('select-accounts-step')).not.toBeInTheDocument()
  })

  it('greets a brand-new Workspace with the full feature list and sends it straight to Stripe', () => {
    mockSpaceSafes.mockReturnValue({ safes: {} })
    const onBack = jest.fn()
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={onBack} returnPathname="/welcome/select-safes" variant="new" />)

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Workspaces run on Safe Pro')
    expect(screen.getByText('Your first 60 days are free.')).toBeInTheDocument()
    expect(screen.getByText(/No payment method required/)).toBeInTheDocument()
    expect(screen.getByTestId('trial-end-tooltip')).toBeInTheDocument()
    expect(screen.getByText('Unlimited Workspace members')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Go to My accounts' }))
    expect(onBack).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Claim free access/ }))
    expect(mockStartCheckout).toHaveBeenCalledWith(SPACE_ID, '/welcome/select-safes', 'pl_business')
    expect(mockRemoveSafes).not.toHaveBeenCalled()
    expect(screen.queryByTestId('select-accounts-step')).not.toBeInTheDocument()
  })

  it('removes the Safes left out of the picked plan and then checks out', async () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [STARTER], trialPeriodDays: 30, isLoading: false })
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB', '0xC'] } })
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} returnPathname="/welcome/select-safes" />)

    fireEvent.click(screen.getByRole('button', { name: /Claim free access/ }))
    expect(mockStartCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-limit', '2')
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-plan', 'Starter')

    fireEvent.click(screen.getByText('step-back'))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Start your 30-day free access to Safe Pro')

    fireEvent.click(screen.getByRole('button', { name: /Claim free access/ }))
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

    fireEvent.click(screen.getByRole('button', { name: /Claim free access/ }))
    fireEvent.click(screen.getByText('step-continue'))

    await waitFor(() => expect(mockRemoveSafes).toHaveBeenCalled())
    expect(mockStartCheckout).not.toHaveBeenCalled()
    expect(screen.getByTestId('select-accounts-step')).toHaveTextContent('Boom')
  })

  it('lets the admin pick between several trial offers and carries the pick into the accounts step', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [BUSINESS, STARTER], trialPeriodDays: 60, isLoading: false })
    mockSpaceSafes.mockReturnValue({ safes: { '1': ['0xA', '0xB', '0xC'] } })
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByRole('radio', { name: /Business/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /Starter/ }))
    fireEvent.click(screen.getByRole('button', { name: /Claim free access/ }))

    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-plan', 'Starter')
    expect(screen.getByTestId('select-accounts-step')).toHaveAttribute('data-limit', '2')
  })

  it('shows a skeleton while the offers load and an empty state without a trial', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPlans: [], trialPeriodDays: null, isLoading: true })
    const { rerender } = render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(screen.getByTestId('claim-trial-skeleton')).toBeInTheDocument()

    mockUseSpaceOffers.mockReturnValue({ trialPlans: [], trialPeriodDays: null, isLoading: false })
    rerender(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)
    expect(screen.getByText('There is no free access available for this Workspace.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Claim free access/ })).toBeDisabled()
  })

  it('surfaces a checkout failure', () => {
    mockCheckoutState = { isError: true }
    render(<ClaimTrialModal spaceId={SPACE_ID} onBack={jest.fn()} />)

    expect(screen.getByText('We couldn’t start the checkout. Please try again.')).toBeInTheDocument()
  })
})
