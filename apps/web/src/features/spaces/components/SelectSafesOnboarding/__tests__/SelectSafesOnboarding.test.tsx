import { render, screen, act, fireEvent } from '@/tests/test-utils'
import SelectSafesOnboarding from '../index'
import type { AllSafeItems } from '@/hooks/safes'
import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'

jest.mock('@/features/spaces/constants', () => ({
  ...jest.requireActual('@/features/spaces/constants'),
  SAFE_ACCOUNTS_LIMIT: 10,
}))

jest.mock('@/hooks/useIsSurveyEnabled')
let mockSafeLimit: { limit: number | null | undefined; isError: boolean } = { limit: 10, isError: false }
const mockRetryLimit = jest.fn()
jest.mock('../../../hooks/useSpaceSafeLimit', () => ({
  useSpaceSafeLimit: () => ({ ...mockSafeLimit, isLoading: false, retry: mockRetryLimit }),
}))
const mockedUseIsSurveyEnabled = useIsSurveyEnabled as jest.MockedFunction<typeof useIsSurveyEnabled>

// Captured props from OnboardingSafesList renders
let capturedListProps: Record<string, unknown> = {}

jest.mock('../components/OnboardingSafesList', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedListProps = props
    return <div data-testid="onboarding-safes-list" />
  },
}))

jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => jest.fn(),
}))

const mockHandleBack = jest.fn()
const mockHandleSkip = jest.fn()
const mockRedirectToNextStep = jest.fn()

jest.mock('../hooks/useOnboardingNavigation', () => ({
  __esModule: true,
  default: () => ({
    spaceId: '1',
    handleBack: mockHandleBack,
    handleSkip: mockHandleSkip,
    redirectToNextStep: mockRedirectToNextStep,
  }),
}))

let mockTrustedSafes: AllSafeItems = []
let mockOwnedSafes: AllSafeItems = []
let mockFlagged = new Set<string>()

jest.mock('../hooks/useOnboardingSafes', () => ({
  __esModule: true,
  default: () => ({
    trustedSafes: mockTrustedSafes,
    ownedSafes: mockOwnedSafes,
    flaggedAddresses: mockFlagged,
    handleSearch: jest.fn(),
    hasNoSafes: false,
  }),
}))

let mockStep: 'select' | 'name' = 'select'
const mockShowSelectStep = jest.fn()

jest.mock('../hooks/useOnboardingSubmit', () => ({
  __esModule: true,
  default: function useOnboardingSubmitMock() {
    const { useForm } = require('react-hook-form')
    const formMethods = useForm({ defaultValues: { selectedSafes: {}, names: {} } })
    return {
      formMethods,
      onSubmit: jest.fn((e?: Event) => e?.preventDefault?.()),
      selectedSafesLength: mockStep === 'name' ? 1 : 0,
      error: undefined,
      isSubmitting: false,
      isAddressBookReady: true,
      step: mockStep,
      safesToName: mockStep === 'name' ? mockTrustedSafes : [],
      showSelectStep: mockShowSelectStep,
    }
  },
}))

jest.mock('../../NameAccounts', () => ({
  ...jest.requireActual('../../NameAccounts'),
  NameAccountsFields: ({ items }: { items: unknown[] }) => (
    <div data-testid="name-accounts-fields" data-count={items.length} />
  ),
}))

let mockWalletValue: { address: string } | null = { address: '0xWallet' }

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('../../Plans/CheckoutReturnModals', () => ({
  __esModule: true,
  default: ({ trialCtaLabel }: { trialCtaLabel?: string }) => (
    <div data-testid="checkout-return-modals">{trialCtaLabel}</div>
  ),
}))

const makeSafe = (chainId: string, address: string) => ({
  chainId,
  address,
  isPinned: false,
  isReadOnly: false,
  lastVisited: 0,
  name: undefined,
})

describe('SelectSafesOnboarding — Stripe return', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
  })

  it('confirms the trial on landing with a Get started CTA', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('checkout-return-modals')).toHaveTextContent('Get started')
  })
})

describe('SelectSafesOnboarding — selection wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
    mockSafeLimit = { limit: 10, isError: false }
  })

  it('shows a selected-count of the per-workspace cap instead of a select-all control', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent('0 of 10 selected')
    expect(screen.queryByTestId('select-all-trusted')).not.toBeInTheDocument()
    expect(screen.queryByTestId('select-all-owned')).not.toBeInTheDocument()
  })

  it('passes the selection model (not select-all toggles) to OnboardingSafesList', () => {
    mockOwnedSafes = [makeSafe('10', '0xB')] as AllSafeItems
    mockFlagged = new Set(['0xb'])
    render(<SelectSafesOnboarding />)

    expect(capturedListProps.selectedKeys).toBeInstanceOf(Set)
    expect(typeof capturedListProps.onToggle).toBe('function')
    expect(capturedListProps.isAtLimit).toBe(false)
    expect(capturedListProps.flaggedAddresses).toBe(mockFlagged)
    expect(capturedListProps.trustedSelectAll).toBeUndefined()
    expect(capturedListProps.ownedSelectAll).toBeUndefined()
  })

  it('increments the selected-count when a row is toggled on', () => {
    render(<SelectSafesOnboarding />)

    const onToggle = capturedListProps.onToggle as (line: unknown, checked: boolean) => void
    act(() => onToggle({ key: '1:0xA', variant: 'single', address: '0xA', source: makeSafe('1', '0xA') }, true))

    expect(screen.getByTestId('selected-count')).toHaveTextContent('1 of 10 selected')
  })

  it('shows no limit and locks the list while the limit is unknown', () => {
    mockSafeLimit = { limit: undefined, isError: false }
    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent(/^\s*0 selected$/)
    expect(capturedListProps.isAtLimit).toBe(true)
    expect(screen.queryByTestId('safe-limit-error')).not.toBeInTheDocument()
  })

  it('offers a retry when the limit fails to load', () => {
    mockSafeLimit = { limit: undefined, isError: true }
    render(<SelectSafesOnboarding />)

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(mockRetryLimit).toHaveBeenCalled()
  })
})

describe('SelectSafesOnboarding — wallet connection state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
  })

  it('renders the safes list and Continue button when a wallet is connected', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('onboarding-safes-list')).toBeInTheDocument()
    expect(screen.getByTestId('select-safes-continue-button')).toBeInTheDocument()
    expect(screen.queryByTestId('select-safes-connect-wallet-button')).not.toBeInTheDocument()
  })

  it('still renders the list, Continue, and an inline connect hint when no wallet is connected', () => {
    mockWalletValue = null
    render(<SelectSafesOnboarding />)

    // No-wallet users can still pick their locally stored Safes; the wallet CTA is just an inline hint.
    expect(screen.getByTestId('onboarding-safes-list')).toBeInTheDocument()
    expect(screen.getByTestId('select-safes-continue-button')).toBeInTheDocument()
    expect(screen.getByTestId('select-safes-connect-wallet-button')).toBeInTheDocument()
  })

  it('shows the skip link when no wallet is connected', () => {
    mockWalletValue = null
    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('select-safes-skip-link')).toBeInTheDocument()
  })
})

describe('SelectSafesOnboarding — step counter reflects the survey flag', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
  })

  // Regression guard for WA-2537: the survey is the optional last step, so when
  // SPACE_ONBOARDING_SURVEY is off the always-rendered steps must total 3, not 4.
  it('shows 3 total steps when the survey is disabled', () => {
    mockedUseIsSurveyEnabled.mockReturnValue(false)
    render(<SelectSafesOnboarding />)
    expect(screen.getByRole('group', { name: 'Step 2 of 3' })).toBeInTheDocument()
  })

  it('shows 4 total steps when the survey is enabled', () => {
    mockedUseIsSurveyEnabled.mockReturnValue(true)
    render(<SelectSafesOnboarding />)
    expect(screen.getByRole('group', { name: 'Step 2 of 4' })).toBeInTheDocument()
  })
})

describe('SelectSafesOnboarding — naming step', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
    mockStep = 'name'
  })

  afterEach(() => {
    mockStep = 'select'
  })

  it('replaces the list with the name fields and keeps the step counter on step 2', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.getByText('Name your Safe accounts')).toBeInTheDocument()
    expect(screen.getByTestId('name-accounts-fields')).toHaveAttribute('data-count', '1')
    expect(screen.queryByTestId('onboarding-safes-list')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Step 2 of/ })).toBeInTheDocument()
  })

  it('submits with an "Add accounts" label and hides the skip link', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('select-safes-continue-button')).toHaveTextContent('Add accounts')
    expect(screen.queryByTestId('select-safes-skip-link')).not.toBeInTheDocument()
  })

  it('goes back to the selection step instead of the previous onboarding page', () => {
    render(<SelectSafesOnboarding />)

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(mockShowSelectStep).toHaveBeenCalled()
    expect(mockHandleBack).not.toHaveBeenCalled()
  })
})
