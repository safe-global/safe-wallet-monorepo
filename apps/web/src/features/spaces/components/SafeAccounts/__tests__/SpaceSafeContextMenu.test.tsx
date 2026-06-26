import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SpaceSafeContextMenu from '../SpaceSafeContextMenu'
import { useAppSelector } from '@/store'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useIsAdmin } from '@/features/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const mockOpenRename = jest.fn()

jest.mock('@/store')
jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(),
  useCurrentSpaceId: jest.fn(() => 'space-uuid'),
  useRenameSafe: () => ({ openRename: mockOpenRename, renameDialog: <div data-testid="rename-safe-dialog" /> }),
}))
jest.mock('@/services/analytics')
jest.mock('@/hooks/safes', () => ({
  isMultiChainSafeItem: jest.fn(),
}))

// Space-first name resolution; defaults to no space name so the local fallback is asserted.
const mockGetFromSpaceByAddress = jest.fn((): { name: string } | undefined => undefined)
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useMergedAddressBooks: () => ({ getFromSpaceByAddress: mockGetFromSpaceByAddress }),
}))

jest.mock('../RemoveSafeDialog', () => {
  return jest.fn(() => <div data-testid="remove-safe-dialog">Remove Safe Dialog</div>)
})

describe('SpaceSafeContextMenu', () => {
  const mockSafeItem: SafeItem = {
    address: '0x123',
    chainId: '5',
    isReadOnly: false,
    isPinned: false,
    lastVisited: 0,
    name: 'Test Safe',
  }

  const mockMultiChainSafeItem: MultiChainSafeItem = {
    address: '0x123',
    name: 'Multi Chain Safe',
    safes: [
      { address: '0x123', chainId: '5', isReadOnly: false, isPinned: false, lastVisited: 0, name: 'Test Safe 1' },
      { address: '0x123', chainId: '1', isReadOnly: false, isPinned: false, lastVisited: 0, name: 'Test Safe 2' },
    ],
    isPinned: false,
    lastVisited: 0,
  }

  const mockAddressBooks = {
    '5': {
      '0x123': 'Test Safe Name',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetFromSpaceByAddress.mockReturnValue(undefined)
    ;(useAppSelector as jest.Mock).mockReturnValue(mockAddressBooks)
    // Rename + Remove are admin-only in a space, so default to admin to render the menu.
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    ;(isMultiChainSafeItem as unknown as jest.Mock).mockImplementation(
      (item) => 'safes' in item && Array.isArray(item.safes),
    )
  })

  it('renders nothing for non-admins', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    const { container } = render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the menu button for admins (SafeItem)', () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders the menu button for admins (MultiChainSafeItem)', () => {
    render(<SpaceSafeContextMenu safeItem={mockMultiChainSafeItem} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('opens the context menu with Rename and Remove for admins', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument()
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })
  })

  it('opens the rename dialog with isSpaceSafe + spaceId and the chainId (single-chain)', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => fireEvent.click(screen.getByText('Rename')))

    expect(mockOpenRename).toHaveBeenCalledWith({
      address: '0x123',
      chainIds: ['5'],
      currentName: 'Test Safe Name',
      isSpaceSafe: true,
      spaceId: 'space-uuid',
    })
    expect(screen.getByTestId('rename-safe-dialog')).toBeInTheDocument()
  })

  it('prefills the shared (space) name, not the local one, when a space name exists', async () => {
    mockGetFromSpaceByAddress.mockReturnValue({ name: 'Cloud Name' })
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => fireEvent.click(screen.getByText('Rename')))

    expect(mockOpenRename).toHaveBeenCalledWith(expect.objectContaining({ currentName: 'Cloud Name' }))
  })

  it('opens the rename dialog with all chainIds for a multi-chain safe', async () => {
    render(<SpaceSafeContextMenu safeItem={mockMultiChainSafeItem} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => fireEvent.click(screen.getByText('Rename')))

    expect(mockOpenRename).toHaveBeenCalledWith({
      address: '0x123',
      chainIds: ['5', '1'],
      currentName: 'Multi Chain Safe',
      isSpaceSafe: true,
      spaceId: 'space-uuid',
    })
  })

  it('opens RemoveSafeDialog when clicking Remove', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => fireEvent.click(screen.getByText('Remove')))

    expect(screen.getByTestId('remove-safe-dialog')).toBeInTheDocument()
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.DELETE_ACCOUNT_MODAL)
  })
})
