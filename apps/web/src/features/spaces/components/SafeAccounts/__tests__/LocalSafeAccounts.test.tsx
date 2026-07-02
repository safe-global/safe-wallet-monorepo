import type { ReactNode } from 'react'
import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import LocalSafeAccounts from '../LocalSafeAccounts'
import useLocalAccountsView from '@/hooks/useLocalAccountsView'
import { useAllSafesGrouped } from '@/hooks/safes'
import { useSpaceSafes } from '../../../hooks/useSpaceSafes'
import { useSpaceSafesCreateV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

jest.mock('@/hooks/useLocalAccountsView')
jest.mock('@/hooks/safes', () => ({
  useAllSafesGrouped: jest.fn(),
  isMultiChainSafeItem: (item: { safes?: unknown }) => Array.isArray(item.safes),
}))
jest.mock('../../../hooks/useSpaceSafes', () => ({ useSpaceSafes: jest.fn() }))
jest.mock('../../../hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => 'space-1' }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({ useSpaceSafesCreateV1Mutation: jest.fn() }))
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({ __esModule: true, default: () => jest.fn() }))
jest.mock('@/components/common/TrustedSafesModal', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/common/TrustedSafesModal/useTrustedSafesModal', () => ({
  __esModule: true,
  default: () => ({ open: jest.fn(), close: jest.fn(), isOpen: false }),
}))
jest.mock('@/services/analytics', () => ({ trackEvent: jest.fn() }))

// Renders each top-level item and applies renderActions the way the real table does per row.
type MockItem = { address: string; chainId?: string; safes?: unknown[] }
type MockLine = { variant: 'single' | 'group'; source: MockItem; key: string; address: string }
jest.mock('@/features/myAccounts', () => ({
  SafeAccountsTable: ({
    items,
    renderActions,
  }: {
    items: MockItem[]
    renderActions?: (line: MockLine) => ReactNode
  }) => (
    <div data-testid="safe-accounts-table">
      {items.map((item) => {
        const isMulti = Array.isArray(item.safes)
        const line: MockLine = {
          variant: isMulti ? 'group' : 'single',
          source: item,
          key: isMulti ? `multi-${item.address}` : `${item.chainId}:${item.address}`,
          address: item.address,
        }
        return (
          <div key={line.key} data-testid="safe-row">
            {item.address}
            {renderActions?.(line)}
          </div>
        )
      })}
    </div>
  ),
}))

const mockUseLocalAccountsView = useLocalAccountsView as jest.Mock
const mockUseAllSafesGrouped = useAllSafesGrouped as jest.Mock
const mockUseSpaceSafes = useSpaceSafes as jest.Mock
const mockUseCreate = useSpaceSafesCreateV1Mutation as jest.Mock

const safeA = { chainId: '1', address: '0xaaa', isPinned: true }
const safeB = { chainId: '1', address: '0xbbb', isPinned: true }

describe('LocalSafeAccounts', () => {
  const mockAdd = jest.fn().mockResolvedValue({ data: {} })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCreate.mockReturnValue([mockAdd, {}])
    mockUseAllSafesGrouped.mockReturnValue({ allSingleSafes: [safeA, safeB], allMultiChainSafes: [] })
    // safeA is already a member of the space (uppercase to prove case-insensitive matching)
    mockUseSpaceSafes.mockReturnValue({ allSafes: [{ chainId: '1', address: '0xAAA' }] })
  })

  it('prompts to connect a wallet in the connect-wallet state', () => {
    mockUseLocalAccountsView.mockReturnValue('connect-wallet')
    render(<LocalSafeAccounts />)
    expect(screen.getByTestId('local-connect-wallet')).toBeInTheDocument()
  })

  it('shows the add-trusted card in the add-trusted state', () => {
    mockUseLocalAccountsView.mockReturnValue('add-trusted')
    render(<LocalSafeAccounts />)
    expect(screen.getByTestId('add-trusted-safes-card')).toBeInTheDocument()
  })

  it('lists trusted safes with per-row add/added state and a manage button', () => {
    mockUseLocalAccountsView.mockReturnValue('list')
    render(<LocalSafeAccounts />)

    expect(screen.getAllByTestId('safe-row')).toHaveLength(2)
    // safeA is already in the space, safeB is not
    expect(screen.getByRole('button', { name: 'Already added' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add to workspace' })).toBeEnabled()
    expect(screen.getByTestId('manage-trusted-safes-button')).toBeInTheDocument()
  })

  it('adds a trusted safe to the current workspace', async () => {
    mockUseLocalAccountsView.mockReturnValue('list')
    render(<LocalSafeAccounts />)

    await userEvent.click(screen.getByRole('button', { name: 'Add to workspace' }))

    expect(mockAdd).toHaveBeenCalledWith({
      spaceId: 'space-1',
      createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xbbb' }] },
    })
  })
})
