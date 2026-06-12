import { render, screen } from '@/tests/test-utils'
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

jest.mock('../hooks/useOnboardingSafes', () => ({
  __esModule: true,
  default: () => ({
    trustedSafes: mockTrustedSafes,
    ownedSafes: mockOwnedSafes,
    similarAddresses: new Set<string>(),
    handleSearch: jest.fn(),
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

describe('SelectSafesOnboarding — SelectAll wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = []
    mockOwnedSafes = []
    mockWalletValue = { address: '0xWallet' }
  })

  it('does not render global select-all toggle', () => {
    render(<SelectSafesOnboarding />)
    expect(screen.queryByTestId('select-all-global')).not.toBeInTheDocument()
  })

  it('never renders global select-all toggle even when safes are present', () => {
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    render(<SelectSafesOnboarding />)
    expect(screen.queryByTestId('select-all-global')).not.toBeInTheDocument()
  })

  it('passes trustedSelectAll and ownedSelectAll to OnboardingSafesList', () => {
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = [makeSafe('10', '0xB')] as AllSafeItems
    render(<SelectSafesOnboarding />)

    expect(capturedListProps.trustedSelectAll).toBeDefined()
    expect(capturedListProps.ownedSelectAll).toBeDefined()
  })

  it('trustedSelectAll reflects only trusted safes count', () => {
    mockTrustedSafes = [makeSafe('1', '0xA'), makeSafe('1', '0xB')] as AllSafeItems
    mockOwnedSafes = [makeSafe('10', '0xC')] as AllSafeItems
    render(<SelectSafesOnboarding />)

    const trusted = capturedListProps.trustedSelectAll as { total: number; state: string }
    expect(trusted.total).toBe(2)
    expect(trusted.state).toBe('none')
  })

  it('passes count info to section toggles via OnboardingSafesList props', () => {
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    render(<SelectSafesOnboarding />)
    const trusted = capturedListProps.trustedSelectAll as { total: number; count: number }
    expect(trusted.total).toBe(1)
    expect(trusted.count).toBe(0)
  })

  it('passes isAtLimit to OnboardingSafesList once the cap is hit', () => {
    mockTrustedSafes = Array.from({ length: 11 }, (_, i) =>
      makeSafe('1', `0x${i.toString().padStart(40, '0')}`),
    ) as AllSafeItems

    render(<SelectSafesOnboarding />)

    expect(capturedListProps.isAtLimit).toBe(false)

    const trustedSelectAll = capturedListProps.trustedSelectAll as { onToggle: (check: boolean) => void }
    const { act } = require('@testing-library/react')
    act(() => trustedSelectAll.onToggle(true))

    expect(capturedListProps.isAtLimit).toBe(true)
  })

  it('does not pass isAtLimit when below the cap', () => {
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    render(<SelectSafesOnboarding />)

    expect(capturedListProps.isAtLimit).toBe(false)
  })
})

describe('SelectSafesOnboarding — wallet connection state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    mockTrustedSafes = []
    mockOwnedSafes = []
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
    mockTrustedSafes = []
    mockOwnedSafes = []
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
