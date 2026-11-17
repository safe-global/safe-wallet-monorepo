import { render, screen, act, fireEvent } from '@/tests/test-utils'
import SelectSafesOnboarding from '../index'
import type useOnboardingSubmit from '../hooks/useOnboardingSubmit'
import type { AllSafeItems, MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as gatewayApi from '@/store/api/gateway'
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
let mockSpaceSafes: AllSafeItems = []
jest.mock('../../../hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => ({ allSafes: mockSpaceSafes }),
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
let mockAllSafes: AllSafeItems = []
let mockFlagged = new Set<string>()

jest.mock('../hooks/useOnboardingSafes', () => ({
  __esModule: true,
  default: () => ({
    trustedSafes: mockTrustedSafes,
    ownedSafes: mockOwnedSafes,
    allSafes: mockAllSafes,
    flaggedAddresses: mockFlagged,
    handleSearch: jest.fn(),
    hasNoSafes: false,
  }),
}))

let mockStep: 'select' | 'name' = 'select'
const mockShowSelectStep = jest.fn()
let mockInitialSelection: Record<string, boolean> = {}
let mockUseRealSubmit = false

jest.mock('../hooks/useOnboardingSubmit', () => {
  const { default: useRealSubmit } = jest.requireActual<{ default: typeof useOnboardingSubmit }>(
    '../hooks/useOnboardingSubmit',
  )
  const useFakeSubmit = () => {
    const { useForm } = require('react-hook-form')
    const formMethods = useForm({ defaultValues: { selectedSafes: mockInitialSelection, names: {} } })
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
  }
  return {
    __esModule: true,
    default: function useOnboardingSubmitMock(...args: Parameters<typeof useOnboardingSubmit>) {
      const useSubmit = mockUseRealSubmit ? useRealSubmit : useFakeSubmit
      return useSubmit(...args)
    },
  }
})

jest.mock('../../NameAccounts', () => ({
  ...jest.requireActual('../../NameAccounts'),
  NameAccountsFields: ({ items }: { items: Array<{ address: string; name?: string }> }) => (
    <div data-testid="name-accounts-fields" data-count={items.length}>
      {items.map((item) => (
        <span key={item.address}>{`${item.address}: ${item.name ?? ''}`}</span>
      ))}
    </div>
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

let mockOffersTrial = false
jest.mock('../hooks/useOffersTrial', () => ({
  __esModule: true,
  default: () => mockOffersTrial,
}))

jest.mock('../../Plans/ClaimTrialModal', () => ({
  __esModule: true,
  default: ({ spaceId, returnPathname }: { spaceId: string; returnPathname?: string }) => (
    <div data-testid="claim-trial-modal" data-space-id={spaceId} data-return-pathname={returnPathname} />
  ),
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

describe('SelectSafesOnboarding — trial offer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrustedSafes = [makeSafe('1', '0xA')] as AllSafeItems
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
  })

  afterEach(() => {
    mockOffersTrial = false
  })

  it('offers the trial again when the Workspace comes back without a plan', () => {
    mockOffersTrial = true

    render(<SelectSafesOnboarding />)

    expect(screen.getByTestId('claim-trial-modal')).toHaveAttribute('data-return-pathname', '/welcome/select-safes')
  })

  it('does not offer the trial when the Workspace has a plan', () => {
    render(<SelectSafesOnboarding />)

    expect(screen.queryByTestId('claim-trial-modal')).not.toBeInTheDocument()
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

describe('SelectSafesOnboarding — selected Safes outside the visible list', () => {
  const SAFE_A = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
  const SAFE_B = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb'
  const FIAT: Record<string, string> = { [SAFE_A]: '69.75', [SAFE_B]: '46.5' }
  const safeA = makeSafe('1', SAFE_A)
  const safeB = makeSafe('1', SAFE_B)
  const multichainA: MultiChainSafeItem = {
    address: SAFE_A,
    isPinned: false,
    lastVisited: 0,
    name: undefined,
    safes: [makeSafe('1', SAFE_A), makeSafe('137', SAFE_A)],
  }

  const makeOverview = ({ chainId, address }: SafeItem): SafeOverview => ({
    address: { value: address },
    chainId,
    threshold: 1,
    owners: [],
    fiatTotal: FIAT[address],
    queued: 0,
  })
  const safeLine = (safe: SafeItem) => ({
    key: `${safe.chainId}:${safe.address}`,
    variant: 'single',
    address: safe.address,
    source: safe,
  })
  const groupLine = (group: MultiChainSafeItem) => ({
    key: group.address,
    variant: 'group',
    address: group.address,
    source: group,
  })
  const toggleOn = (line: unknown) => {
    const onToggle = capturedListProps.onToggle as (line: unknown, checked: boolean) => void
    act(() => onToggle(line, true))
  }

  let overviewsQuery: jest.SpyInstance
  let queriedSafes: SafeItem[] = []
  const queriedKeys = () => queriedSafes.map((s) => `${s.chainId}:${s.address}`).sort()

  beforeEach(() => {
    jest.clearAllMocks()
    capturedListProps = {}
    queriedSafes = []
    mockOwnedSafes = []
    mockFlagged = new Set<string>()
    mockWalletValue = { address: '0xWallet' }
    mockSafeLimit = { limit: 10, isError: false }
    overviewsQuery = jest.spyOn(gatewayApi, 'useGetMultipleSafeOverviewsQuery').mockImplementation((({
      safes,
    }: {
      safes: SafeItem[]
    }) => {
      queriedSafes = safes
      return { data: safes.map(makeOverview) }
    }) as never)
  })

  afterEach(() => {
    mockAllSafes = []
    mockSpaceSafes = []
    mockInitialSelection = {}
    mockUseRealSubmit = false
    overviewsQuery.mockRestore()
  })

  it('keeps a selected Safe the search hides in the balance query and its preview row', () => {
    mockTrustedSafes = [safeA, safeB]
    mockAllSafes = [safeA, safeB]
    const { rerender } = render(<SelectSafesOnboarding />)
    toggleOn(safeLine(safeA))
    toggleOn(safeLine(safeB))

    mockTrustedSafes = [safeB]
    rerender(<SelectSafesOnboarding />)

    expect(queriedKeys()).toEqual([`1:${SAFE_A}`, `1:${SAFE_B}`].sort())
    expect(screen.getByText('$69.75')).toBeInTheDocument()
    expect(screen.getByText(/116\.25/)).toBeInTheDocument()
  })

  it('keeps every chain of a selected multichain Safe the search hides in the balance query', () => {
    mockTrustedSafes = [multichainA, safeB]
    mockAllSafes = [multichainA, safeB]
    const { rerender } = render(<SelectSafesOnboarding />)
    toggleOn(groupLine(multichainA))
    toggleOn(safeLine(safeB))

    mockTrustedSafes = [safeB]
    rerender(<SelectSafesOnboarding />)

    expect(queriedKeys()).toEqual([`1:${SAFE_A}`, `137:${SAFE_A}`, `1:${SAFE_B}`].sort())
  })

  it('totals a selected Workspace Safe that is neither trusted nor owned', () => {
    mockTrustedSafes = [safeA]
    mockAllSafes = [safeA]
    mockSpaceSafes = [safeA, safeB]
    mockInitialSelection = { [`1:${SAFE_A}`]: true, [`1:${SAFE_B}`]: true }

    render(<SelectSafesOnboarding />)

    expect(queriedKeys()).toEqual([`1:${SAFE_A}`, `1:${SAFE_B}`].sort())
    expect(screen.getByText('$46.5')).toBeInTheDocument()
    expect(screen.getByText(/116\.25/)).toBeInTheDocument()
  })

  it('previews a Safe that is both trusted and in the Workspace from its trusted entry', () => {
    const trustedA = { ...safeA, name: 'Trusted name' }
    mockTrustedSafes = [trustedA]
    mockAllSafes = [trustedA]
    mockSpaceSafes = [{ ...safeA, name: 'Workspace name' }]
    mockInitialSelection = { [`1:${SAFE_A}`]: true }

    render(<SelectSafesOnboarding />)

    expect(queriedSafes).toEqual([trustedA])
    expect(screen.getByText('Trusted name')).toBeInTheDocument()
    expect(screen.queryByText('Workspace name')).not.toBeInTheDocument()
  })

  it('keeps the known name of a selected Safe the search hides on the naming step', async () => {
    mockUseRealSubmit = true
    const namedA = { ...safeA, name: 'Alpha' }
    mockTrustedSafes = [namedA, safeB]
    mockAllSafes = [namedA, safeB]
    const { rerender } = render(<SelectSafesOnboarding />)
    toggleOn(safeLine(namedA))
    toggleOn(safeLine(safeB))

    mockTrustedSafes = [safeB]
    rerender(<SelectSafesOnboarding />)
    await act(async () => fireEvent.click(screen.getByTestId('select-safes-continue-button')))

    expect(await screen.findByText(`${SAFE_A}: Alpha`)).toBeInTheDocument()
  })
})
