import { render } from '@/tests/test-utils'
import { screen, within, fireEvent } from '@testing-library/react'
import SafesTable from './index'
import { useAllSafesGrouped, useSafesSearch, type SafeItem } from '@/hooks/safes'

// Render rows as simple markers so we can assert grouping without the heavy data hooks.
jest.mock('./SafeTableRow', () => ({
  __esModule: true,
  default: ({ safeItem }: { safeItem: SafeItem }) => <div data-testid="row">{safeItem.name ?? safeItem.address}</div>,
}))
jest.mock('./MultiChainSafeTableRow', () => ({
  __esModule: true,
  default: ({ multiSafeAccountItem }: { multiSafeAccountItem: { name?: string; address: string } }) => (
    <div data-testid="row">{multiSafeAccountItem.name ?? multiSafeAccountItem.address}</div>
  ),
}))

jest.mock('@/hooks/safes', () => {
  const actual = jest.requireActual('@/hooks/safes')
  return { ...actual, useAllSafesGrouped: jest.fn(), useSafesSearch: jest.fn() }
})
jest.mock('@/components/common/TrustedSafesModal', () => ({ __esModule: true, default: () => null }))
jest.mock('../MigrationPrompt', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/common/TrustedSafesModal/useTrustedSafesModal', () => ({
  __esModule: true,
  default: () => ({ open: jest.fn() }),
}))
jest.mock('../../hooks/useMigrationPrompt', () => ({
  __esModule: true,
  default: () => ({ shouldShowPrompt: false, hasPinnedSafes: true }),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => ({ address: '0x1234567890123456789012345678901234567890' }),
}))

const mockedGrouped = useAllSafesGrouped as jest.Mock
const mockedSearch = useSafesSearch as jest.Mock

const safe = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0x0',
  isReadOnly: true,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

describe('SafesTable', () => {
  beforeEach(() => {
    mockedSearch.mockReturnValue([])
    mockedGrouped.mockReturnValue({ allMultiChainSafes: [], allSingleSafes: [] })
  })

  it('shows workspace safes in the Workspace tab and trusted safes under the Local tab', () => {
    mockedGrouped.mockReturnValue({
      allMultiChainSafes: [],
      allSingleSafes: [safe({ address: '0xtrust', name: 'TrustedSafe', isPinned: true })],
    })

    render(<SafesTable workspaceSafes={[safe({ address: '0xws', name: 'WorkspaceSafe', isReadOnly: false })]} />)

    // Workspace tab is the default
    expect(within(screen.getByTestId('workspace-safes-section')).getByText('WorkspaceSafe')).toBeInTheDocument()

    // Trusted safes live under the Local tab
    fireEvent.click(screen.getByTestId('local-safes-tab'))
    expect(within(screen.getByTestId('trusted-safes-section')).getByText('TrustedSafe')).toBeInTheDocument()
  })
})
