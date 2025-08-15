import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SpaceSafeContextMenu from '../SpaceSafeContextMenu'
import { useAppSelector } from '@/store'
import { useIsAdmin } from '@/features/spaces/hooks/useSpaceMembers'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

jest.mock('@/store')
jest.mock('@/features/spaces/hooks/useSpaceMembers')
jest.mock('@/services/analytics')
jest.mock('@/features/multichain/utils/utils')

jest.mock('../RemoveSafeDialog', () => {
  return jest.fn(() => <div data-testid="remove-safe-dialog">Remove Safe Dialog</div>)
})

jest.mock('@/components/address-book/EntryDialog', () => {
  return jest.fn(() => <div data-testid="entry-dialog">Entry Dialog</div>)
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
    ;(useAppSelector as jest.Mock).mockReturnValue(mockAddressBooks)
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    ;(isMultiChainSafeItem as unknown as jest.Mock).mockImplementation(
      (item) => 'safes' in item && Array.isArray(item.safes),
    )
  })

  it('renders with a SafeItem', () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    expect(menuButton).toBeInTheDocument()
  })

  it('renders with a MultiChainSafeItem', () => {
    render(<SpaceSafeContextMenu safeItem={mockMultiChainSafeItem} />)

    const menuButton = screen.getByRole('button')
    expect(menuButton).toBeInTheDocument()
  })

  it('opens context menu when clicking the button', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument()
    })
  })

  it('shows "Give name" when safe has no name', async () => {
    ;(useAppSelector as jest.Mock).mockReturnValue({})

    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Give name')).toBeInTheDocument()
    })
  })

  it('shows "Rename" when safe has a name in address book', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument()
    })
  })

  it('shows "Rename" when MultiChainSafeItem has a name', async () => {
    render(<SpaceSafeContextMenu safeItem={mockMultiChainSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument()
    })
  })

  it('shows Remove option for admin users', async () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)

    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })
  })

  it('does not show Remove option for non-admin users', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    })
  })

  it('opens EntryDialog when clicking Rename option', async () => {
    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      const renameOption = screen.getByText('Rename')
      fireEvent.click(renameOption)
    })

    // Verify the EntryDialog is rendered
    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
  })

  it('opens RemoveSafeDialog when clicking Remove option', async () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)

    render(<SpaceSafeContextMenu safeItem={mockSafeItem} />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    await waitFor(() => {
      const removeOption = screen.getByText('Remove')
      fireEvent.click(removeOption)
    })

    // Verify the RemoveSafeDialog is rendered
    expect(screen.getByTestId('remove-safe-dialog')).toBeInTheDocument()
    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.DELETE_ACCOUNT_MODAL)
  })
})
