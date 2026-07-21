import { render, screen, act } from '@/tests/test-utils'
import SelectSafesOnboarding from '../index'
import type { AllSafeItems } from '@/hooks/safes'
import useIsSurveyEnabled from '@/hooks/useIsSurveyEnabled'

jest.mock('@/features/spaces/constants', () => ({
  ...jest.requireActual('@/features/spaces/constants'),
  SAFE_ACCOUNTS_LIMIT: 10,
}))

jest.mock('@/hooks/useIsSurveyEnabled')
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
let mockFlaggedOwned = new Set<string>()

jest.mock('../hooks/useOnboardingSafes', () => ({
  __esModule: true,
  default: () => ({
    trustedSafes: mockTrustedSafes,
    ownedSafes: mockOwnedSafes,
    flaggedOwnedAddresses: mockFlaggedOwned,
    handleSearch: jest.fn(),
    hasNoSafes: false,
  }),
}))

jest.mock('../hooks/useOnboardingSubmit', () => ({
  __esModule: true,
  default: function useOnboardingSubmitMock() {
    const { useForm } = require('react-hook-form')
    const formMethods = useForm({ defaultValues: { selectedSafes: {} } })
    return {
      formMethods,
      onSubmit: jest.fn((e?: Event) => e?.preventDefault?.()),
      selectedSafesLength: 0,
      error: undefined,
      isSubmitting: false,
    }
  },
}))

let mockWalletValue: { address: string } | null = { address: '0xWallet' }

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

const makeSafe = (chainId: string, address: string) => ({
  chainId,
  address,
  isPinned: false,
  isReadOnly: false,
  lastVisited: 0,
  name: undefined,
})

describe('SelectSafesOnboarding — selection wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlaggedOwned = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
  })

  it('shows a selected-count of the per-workspace cap instead of a select-all control', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.getByText(/0 of 10 selected/i)).toBeInTheDocument()
    expect(screen.queryByTestId('select-all-trusted')).not.toBeInTheDocument()
    expect(screen.queryByTestId('select-all-owned')).not.toBeInTheDocument()
  })

  it('passes the selection model (not select-all toggles) to OnboardingSafesList', () => {
    mockOwnedSafes = [makeSafe('10', '0xB')] as AllSafeItems
    mockFlaggedOwned = new Set(['0xb'])
    render(<SelectSafesOnboarding />)

    expect(capturedListProps.selectedKeys).toBeInstanceOf(Set)
    expect(typeof capturedListProps.onToggle).toBe('function')
    expect(capturedListProps.isAtLimit).toBe(false)
    expect(capturedListProps.flaggedOwnedAddresses).toBe(mockFlaggedOwned)
    expect(capturedListProps.trustedSelectAll).toBeUndefined()
    expect(capturedListProps.ownedSelectAll).toBeUndefined()
  })

  it('increments the selected-count when a row is toggled on', () => {
    render(<SelectSafesOnboarding />)

    const onToggle = capturedListProps.onToggle as (line: unknown, checked: boolean) => void
    act(() => onToggle({ key: '1:0xA', variant: 'single', address: '0xA', source: makeSafe('1', '0xA') }, true))

    expect(screen.getByText(/1 of 10 selected/i)).toBeInTheDocument()
  })
})

describe('SelectSafesOnboarding — wallet connection state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlaggedOwned = new Set<string>()
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
    mockFlaggedOwned = new Set<string>()
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
