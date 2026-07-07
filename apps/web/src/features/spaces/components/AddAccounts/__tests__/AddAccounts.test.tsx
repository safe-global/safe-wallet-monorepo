import { fireEvent, render, screen } from '@/tests/test-utils'
import AddAccounts from '../index'

jest.mock('../AddManually', () => ({
  __esModule: true,
  default: () => <div data-testid="add-manually" />,
}))

// The heavy accounts table is exercised in its own suite; here we only need to observe the items it receives.
jest.mock('@/features/myAccounts', () => ({
  __esModule: true,
  SafeAccountsTable: (props: { items: unknown[] }) => (
    <div data-testid="safe-accounts-table" data-count={props.items.length} />
  ),
}))

const mockTrustedOpen = jest.fn()
const mockTrustedClose = jest.fn()
jest.mock('@/components/common/TrustedSafesModal/useTrustedSafesModal', () => ({
  __esModule: true,
  default: () => ({ open: mockTrustedOpen, close: mockTrustedClose, isOpen: false }),
}))

jest.mock('@/components/common/TrustedSafesModal/ManageTrustedSafesContent', () => ({
  __esModule: true,
  default: ({ onSecondary, onSaved }: { onSecondary: () => void; onSaved?: () => void }) => (
    <div data-testid="manage-trusted-content">
      <button data-testid="manage-content-back" onClick={onSecondary}>
        content-back
      </button>
      <button data-testid="manage-content-save" onClick={() => onSaved?.()}>
        content-save
      </button>
    </div>
  ),
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

let mockWalletValue: { address: string } | null = { address: '0xWallet' }
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [{ chainId: '1' }] }),
}))

let mockAllOwned: Record<string, string[]> = {}
jest.mock('@/hooks/safes', () => {
  const actual = jest.requireActual('@/hooks/safes')
  return {
    ...actual,
    useAllOwnedSafes: () => [mockAllOwned, false] as const,
    useSafesSearch: (safes: unknown) => safes,
  }
})

let mockIsAdmin = true
let mockSpaceSafes: Array<{ chainId: string; address: string }> = []
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => mockIsAdmin,
  useSpaceSafes: () => ({ allSafes: mockSpaceSafes }),
  useIsQualifiedSafe: () => false,
}))

const mockAddSafesToSpace = jest.fn()
const mockRemoveSafesFromSpace = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesCreateV1Mutation: () => [mockAddSafesToSpace, {}],
  useSpaceSafesDeleteV1Mutation: () => [mockRemoveSafesFromSpace, {}],
}))

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
}))

const TRUSTED_ADDRESS = '0x0000000000000000000000000000000000001234'
const withTrusted = {
  initialReduxState: {
    addedSafes: { '1': { [TRUSTED_ADDRESS]: { owners: [], threshold: 1 } } },
  },
}

describe('AddAccounts — wallet connection state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
  })

  it('does not render the connect-wallet hint when a wallet is connected', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)
    expect(screen.queryByTestId('add-accounts-connect-wallet-button')).not.toBeInTheDocument()
  })

  it('renders an inline connect-wallet hint when no wallet is connected', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)
    expect(screen.getByTestId('add-accounts-connect-wallet-button')).toBeInTheDocument()
  })

  it('clicking the connect-wallet hint triggers wallet connection', () => {
    mockWalletValue = null
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)
    fireEvent.click(screen.getByTestId('add-accounts-connect-wallet-button'))
    expect(mockConnectWallet).toHaveBeenCalled()
  })

  it('shows trusted safes in the list', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    expect(screen.getByTestId('safe-accounts-table')).toHaveAttribute('data-count', '1')
  })

  it('keeps trusted safes that are already in the workspace in the list (shown pre-checked)', () => {
    // The trusted safe is also already part of the current space — it must still appear (not filtered out).
    mockSpaceSafes = [{ chainId: '1', address: TRUSTED_ADDRESS }]
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)
    expect(screen.getByTestId('safe-accounts-table')).toHaveAttribute('data-count', '1')
  })

  it('keeps the manual add affordance available', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />)
    expect(screen.getByTestId('add-manually')).toBeInTheDocument()
  })
})

describe('AddAccounts — manage trusted safes view switch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
  })

  it('switches to the manage view and back', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    // Starts on the picker
    expect(screen.getByText('Trusted Safe accounts')).toBeInTheDocument()
    expect(screen.queryByTestId('manage-trusted-content')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('open-manage-trusted-safes'))

    expect(mockTrustedOpen).toHaveBeenCalled()
    expect(screen.getByTestId('manage-trusted-content')).toBeInTheDocument()
    expect(screen.getByText('Manage trusted Safes')).toBeInTheDocument()

    // Header back returns to the picker without saving
    fireEvent.click(screen.getByTestId('manage-trusted-back'))
    expect(mockTrustedClose).toHaveBeenCalled()
    expect(screen.queryByTestId('manage-trusted-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-accounts-table')).toBeInTheDocument()
  })

  it('returns to the picker after saving in the manage view', () => {
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    fireEvent.click(screen.getByTestId('open-manage-trusted-safes'))
    fireEvent.click(screen.getByTestId('manage-content-save'))

    expect(screen.queryByTestId('manage-trusted-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('safe-accounts-table')).toBeInTheDocument()
  })
})

describe('AddAccounts — admin guard on submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWalletValue = { address: '0xWallet' }
    mockAllOwned = {}
    mockIsAdmin = true
    mockSpaceSafes = []
  })

  it('blocks submission and shows an error when the user is not an admin', async () => {
    mockIsAdmin = false
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    const form = screen.getByTestId('add-accounts-button').closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(await screen.findByText('Only admins can add or remove Safe accounts in this workspace')).toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
  })

  it('disables the trigger button when the user is not an admin', () => {
    mockIsAdmin = false
    render(<AddAccounts />)
    expect(screen.getByTestId('add-space-account-button')).toBeDisabled()
  })

  it('enables the trigger button when the user is an admin', () => {
    mockIsAdmin = true
    render(<AddAccounts />)
    expect(screen.getByTestId('add-space-account-button')).not.toBeDisabled()
  })

  it('does not show the admin error and does not call mutations when an admin submits an empty form', async () => {
    mockIsAdmin = true
    render(<AddAccounts externalOpen onExternalClose={() => {}} />, withTrusted)

    const form = screen.getByTestId('add-accounts-button').closest('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    expect(screen.queryByText('Only admins can add or remove Safe accounts in this workspace')).not.toBeInTheDocument()
    expect(mockAddSafesToSpace).not.toHaveBeenCalled()
    expect(mockRemoveSafesFromSpace).not.toHaveBeenCalled()
  })
})
