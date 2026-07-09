import { render, screen } from '@/tests/test-utils'
import MyAccountsV2 from './MyAccountsV2'
import type { UseMigrationPromptReturn } from '../../hooks/useMigrationPrompt'

const mockWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => mockWallet() }))

const mockMigration = jest.fn()
jest.mock('../../hooks/useMigrationPrompt', () => ({ __esModule: true, default: () => mockMigration() }))

jest.mock('../../hooks/useTrackedSafesCount', () => ({ __esModule: true, default: () => undefined }))

jest.mock('@/hooks/safes', () => ({
  ...jest.requireActual('@/hooks/safes'),
  useAllSafesGrouped: () => ({ allMultiChainSafes: [], allSingleSafes: [] }),
}))

const mockOpen = jest.fn()
jest.mock('@/components/common/TrustedSafesModal/useTrustedSafesModal', () => ({
  __esModule: true,
  default: () => ({ open: mockOpen }),
}))

// Mock leaf children so the test focuses on MyAccountsV2's branching.
jest.mock('../AccountsNavigation', () => ({ __esModule: true, default: () => <div data-testid="accounts-nav" /> }))
jest.mock('./components/GetStartedCard', () => ({
  __esModule: true,
  default: () => <div data-testid="get-started-card" />,
}))
jest.mock('./components/AccountsSearch', () => ({
  __esModule: true,
  default: () => <div data-testid="accounts-search" />,
}))
jest.mock('./components/TrustedAccountsActions', () => ({
  __esModule: true,
  default: () => <div data-testid="trusted-actions" />,
}))
jest.mock('./components/AccountsList', () => ({ __esModule: true, default: () => <div data-testid="accounts-list" /> }))
jest.mock('@/components/common/SafeListSortToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="sort-toggle" />,
}))
jest.mock('@/components/common/TrustedSafesModal', () => ({
  __esModule: true,
  default: () => <div data-testid="trusted-modal" />,
}))
jest.mock('../DataWidget', () => ({ DataWidget: () => <div data-testid="data-widget" /> }))
jest.mock('@/components/common/AddTrustedSafesCard', () => ({
  __esModule: true,
  default: ({ onAdd }: { onAdd: () => void }) => (
    <button data-testid="add-trusted-safes-card" onClick={onAdd}>
      empty state
    </button>
  ),
}))

const migrationState = (overrides: Partial<UseMigrationPromptReturn>): UseMigrationPromptReturn => ({
  shouldShowPrompt: false,
  availableSafeCount: 0,
  hasPinnedSafes: false,
  hasAssociatedSafes: false,
  isLoading: false,
  ...overrides,
})

describe('MyAccountsV2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the Get started card when no wallet is connected and nothing is pinned', () => {
    mockWallet.mockReturnValue(null)
    mockMigration.mockReturnValue(migrationState({ hasPinnedSafes: false }))

    render(<MyAccountsV2 />)

    expect(screen.getByTestId('get-started-card')).toBeInTheDocument()
    expect(screen.queryByTestId('add-trusted-safes-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('accounts-search')).not.toBeInTheDocument()
  })

  it('shows the empty-state card and data widget (but no toolbar) when a wallet has no trusted Safes', () => {
    mockWallet.mockReturnValue({ address: '0x123' })
    mockMigration.mockReturnValue(migrationState({ hasPinnedSafes: false }))

    render(<MyAccountsV2 />)

    expect(screen.getByTestId('add-trusted-safes-card')).toBeInTheDocument()
    expect(screen.getByTestId('data-widget')).toBeInTheDocument()
    expect(screen.queryByTestId('accounts-search')).not.toBeInTheDocument()
    expect(screen.queryByTestId('trusted-actions')).not.toBeInTheDocument()
    expect(screen.queryByTestId('accounts-list')).not.toBeInTheDocument()
  })

  it('shows the toolbar, list and data widget when the user has trusted Safes', () => {
    mockWallet.mockReturnValue({ address: '0x123' })
    mockMigration.mockReturnValue(migrationState({ hasPinnedSafes: true, hasAssociatedSafes: true }))

    render(<MyAccountsV2 />)

    expect(screen.getByTestId('accounts-search')).toBeInTheDocument()
    expect(screen.getByTestId('trusted-actions')).toBeInTheDocument()
    expect(screen.getByTestId('accounts-list')).toBeInTheDocument()
    expect(screen.getByTestId('data-widget')).toBeInTheDocument()
    expect(screen.queryByTestId('add-trusted-safes-card')).not.toBeInTheDocument()
  })

  it('does not flash the empty-state card while safes are still loading', () => {
    mockWallet.mockReturnValue({ address: '0x123' })
    mockMigration.mockReturnValue(migrationState({ hasPinnedSafes: false, isLoading: true }))

    render(<MyAccountsV2 />)

    expect(screen.queryByTestId('add-trusted-safes-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('accounts-list')).toBeInTheDocument()
  })

  it('opens the trusted-safes modal from the empty-state card CTA', async () => {
    mockWallet.mockReturnValue({ address: '0x123' })
    mockMigration.mockReturnValue(migrationState({ hasPinnedSafes: false }))

    render(<MyAccountsV2 />)
    screen.getByTestId('add-trusted-safes-card').click()

    expect(mockOpen).toHaveBeenCalledTimes(1)
  })
})
