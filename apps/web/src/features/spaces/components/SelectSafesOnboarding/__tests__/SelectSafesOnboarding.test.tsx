import { render, screen, fireEvent } from '@/tests/test-utils'
import SelectSafesOnboarding from '../index'
import type { AllSafeItems } from '@/hooks/safes'

jest.mock('../../Sidebar/constants', () => ({
  SAFE_ACCOUNTS_LIMIT: 10,
}))

// Captured props from OnboardingSafesList renders
let capturedListProps: Record<string, unknown> = {}

jest.mock('../components/OnboardingSafesList', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedListProps = props
    return <div data-testid="onboarding-safes-list" />
  },
}))

jest.mock('../components/StepIndicator', () => ({
  __esModule: true,
  default: () => <div data-testid="step-indicator" />,
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
  default: (_spaceId: unknown, _onSuccess: unknown, _allSafes: unknown) => {
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

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => ({ address: '0xWallet' }),
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
  })

  it('does not render SelectAllHeader when there are no safes', () => {
    render(<SelectSafesOnboarding />)
    expect(screen.queryByTestId('select-all-global')).not.toBeInTheDocument()
  })

  it('renders SelectAllHeader when safes are present', () => {
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    render(<SelectSafesOnboarding />)
    expect(screen.getByTestId('select-all-global')).toBeInTheDocument()
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

  it('shows the count in the global toggle', () => {
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    render(<SelectSafesOnboarding />)
    expect(screen.getByText('(0/1)')).toBeInTheDocument()
  })

  it('shows cap message when limit is reached', () => {
    // Pre-fill 10 safes — hitting the mocked SAFE_ACCOUNTS_LIMIT of 10
    mockTrustedSafes = Array.from({ length: 11 }, (_, i) =>
      makeSafe('1', `0x${i.toString().padStart(40, '0')}`),
    ) as AllSafeItems

    render(<SelectSafesOnboarding />)

    const selectAllBtn = screen.getByTestId('select-all-global')
    fireEvent.click(selectAllBtn)

    expect(screen.getByText('Limit of 10 reached')).toBeInTheDocument()
  })
})
