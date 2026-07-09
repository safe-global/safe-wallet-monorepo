import { render, screen, fireEvent } from '@/tests/test-utils'
import TrustedSafesModal from './index'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'
import { useRouter } from 'next/router'
import { useIsQualifiedSafe } from '@/features/spaces'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/spaces/hooks/useIsQualifiedSafe', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock

jest.mock('@/features/myAccounts/hooks/useSafeItemData', () => ({
  useSafeItemData: () => ({
    chain: { chainId: '1', shortName: 'eth' },
    name: undefined,
    href: '/home',
    safeOverview: { fiatTotal: '100', address: { value: '0x123' }, queued: 0, awaitingConfirmation: 0 },
    isCurrentSafe: false,
    isActivating: false,
    isReplayable: false,
    isWelcomePage: false,
    threshold: 1,
    owners: [{ value: '0x123' }],
    undeployedSafe: undefined,
    counterfactualSetup: undefined,
    elementRef: { current: null },
    isVisible: true,
    trackingLabel: 'sidebar',
  }),
}))

const mockRouter = {
  query: { safe: 'eth:0x1234567890abcdef1234567890abcdef12345678' },
  pathname: '/home',
  push: jest.fn(),
}

const mockModal: UseTrustedSafesModalReturn = {
  isOpen: true,
  availableItems: [
    {
      chainId: '1',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Test Safe',
      isPinned: false,
      isReadOnly: false,
      lastVisited: 0,
      isSelected: false,
      similarityGroup: undefined,
    },
    {
      chainId: '1',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'Pinned Safe',
      isPinned: true,
      isReadOnly: false,
      lastVisited: 0,
      isSelected: true,
      similarityGroup: undefined,
    },
  ],
  selectedAddresses: new Set(['0xabcdef1234567890abcdef1234567890abcdef12']),
  pendingConfirmation: null,
  pendingSelectAllConfirmation: false,
  similarAddressesForSelectAll: [],
  searchQuery: '',
  isLoading: false,
  hasChanges: false,
  totalSafesCount: 2,
  selectedCount: 1,
  allSelected: false,
  open: jest.fn(),
  close: jest.fn(),
  toggleSelection: jest.fn(),
  selectAll: jest.fn(),
  deselectAll: jest.fn(),
  confirmSimilarAddress: jest.fn(),
  cancelSimilarAddress: jest.fn(),
  confirmSelectAll: jest.fn(),
  skipSimilarSelectAll: jest.fn(),
  cancelSelectAll: jest.fn(),
  submitSelection: jest.fn(),
  setSearchQuery: jest.fn(),
}

describe('TrustedSafesModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    mockUseIsQualifiedSafe.mockReturnValue(false)
  })

  it('should render modal when open', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.getByText('Manage trusted Safes')).toBeInTheDocument()
  })

  it('hides the "Verify before you trust" banner when no safe is flagged', () => {
    render(<TrustedSafesModal modal={{ ...mockModal, similarAddressesForSelectAll: [] }} />)

    expect(screen.queryByText('Verify before you trust')).not.toBeInTheDocument()
  })

  it('shows the "Verify before you trust" banner when a safe is flagged', () => {
    render(
      <TrustedSafesModal modal={{ ...mockModal, similarAddressesForSelectAll: [{ address: '0xabc' } as never] }} />,
    )

    expect(screen.getByText('Verify before you trust')).toBeInTheDocument()
  })

  it('shows the workspace notice when in a space', () => {
    mockUseIsQualifiedSafe.mockReturnValue(true)

    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.getByTestId('space-notice')).toBeInTheDocument()
  })

  it('hides the workspace notice when not in a space', () => {
    mockUseIsQualifiedSafe.mockReturnValue(false)

    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.queryByTestId('space-notice')).not.toBeInTheDocument()
  })

  it('should render safe items', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    // AccountItem uses checkbox data-testid format: safe-item-checkbox-{address}
    expect(screen.getByTestId('safe-item-checkbox-0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-checkbox-0xabcdef1234567890abcdef1234567890abcdef12')).toBeInTheDocument()
  })

  it('should render the search bar when there are items', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.getByPlaceholderText('Search by name or full address')).toBeInTheDocument()
  })

  it('should hide the search bar when there are no items and no query', () => {
    const emptyModal = { ...mockModal, availableItems: [], searchQuery: '' }
    render(<TrustedSafesModal modal={emptyModal} />)

    expect(screen.queryByPlaceholderText('Search by name or full address')).not.toBeInTheDocument()
  })

  it('should keep the search bar when a query matches nothing', () => {
    const noMatchModal = { ...mockModal, availableItems: [], searchQuery: 'nope' }
    render(<TrustedSafesModal modal={noMatchModal} />)

    expect(screen.getByPlaceholderText('Search by name or full address')).toBeInTheDocument()
  })

  it('should call close when cancel clicked', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockModal.close).toHaveBeenCalled()
  })

  it('should disable Save when there are no changes', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.getByText('Save').closest('button')).toBeDisabled()
  })

  it('should enable Save and call submitSelection when there are changes', () => {
    const modalWithChanges = { ...mockModal, hasChanges: true }
    render(<TrustedSafesModal modal={modalWithChanges} />)

    const saveButton = screen.getByText('Save').closest('button')
    expect(saveButton).not.toBeDisabled()

    fireEvent.click(screen.getByText('Save'))

    expect(modalWithChanges.submitSelection).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    const closedModal = { ...mockModal, isOpen: false }
    const { container } = render(<TrustedSafesModal modal={closedModal} />)

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('should call toggleSelection when clicking safe item', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    // Selected safes float to the top, so the first rendered item is the selected one
    const safeItems = screen.getAllByTestId('safe-list-item')
    fireEvent.click(safeItems[0])

    expect(mockModal.toggleSelection).toHaveBeenCalledWith('0xabcdef1234567890abcdef1234567890abcdef12')
  })

  it('should show similarity confirmation dialog when pendingConfirmation is set', () => {
    const modalWithPending = {
      ...mockModal,
      pendingConfirmation: '0x1234567890abcdef1234567890abcdef12345678',
      availableItems: [
        {
          ...mockModal.availableItems[0],
        },
        mockModal.availableItems[1],
      ],
    }

    render(<TrustedSafesModal modal={modalWithPending} />)

    expect(screen.getByText('Similar address detected')).toBeInTheDocument()
  })

  it('should display Select All and Deselect All buttons', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByText('Deselect All')).toBeInTheDocument()
  })

  it('should call selectAll when Select All clicked', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    fireEvent.click(screen.getByText('Select All'))

    expect(mockModal.selectAll).toHaveBeenCalled()
  })

  it('should call deselectAll when Deselect All clicked', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    fireEvent.click(screen.getByText('Deselect All'))

    expect(mockModal.deselectAll).toHaveBeenCalled()
  })

  it('should show selection count', () => {
    render(<TrustedSafesModal modal={mockModal} />)

    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument()
  })

  it('should show select all confirmation dialog when pendingSelectAllConfirmation is true', () => {
    const modalWithSelectAllConfirmation = {
      ...mockModal,
      pendingSelectAllConfirmation: true,
      similarAddressesForSelectAll: [
        {
          chainId: '1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Similar Safe',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: 'test_group',
        },
      ],
    }

    render(<TrustedSafesModal modal={modalWithSelectAllConfirmation} />)

    expect(screen.getByText('Similar addresses detected')).toBeInTheDocument()
    expect(screen.getByText('No, skip similar addresses')).toBeInTheDocument()
    expect(screen.getByText('Yes, include them anyway')).toBeInTheDocument()
  })

  it('should call confirmSelectAll when confirm clicked in select all dialog', () => {
    const modalWithSelectAllConfirmation = {
      ...mockModal,
      pendingSelectAllConfirmation: true,
      similarAddressesForSelectAll: [
        {
          chainId: '1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Similar Safe',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: 'test_group',
        },
      ],
    }

    render(<TrustedSafesModal modal={modalWithSelectAllConfirmation} />)

    fireEvent.click(screen.getByText('Yes, include them anyway'))

    expect(mockModal.confirmSelectAll).toHaveBeenCalled()
  })

  it('should call skipSimilarSelectAll when skip clicked in select all dialog', () => {
    const modalWithSelectAllConfirmation = {
      ...mockModal,
      pendingSelectAllConfirmation: true,
      similarAddressesForSelectAll: [
        {
          chainId: '1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          name: 'Similar Safe',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: 'test_group',
        },
      ],
    }

    render(<TrustedSafesModal modal={modalWithSelectAllConfirmation} />)

    fireEvent.click(screen.getByText('No, skip similar addresses'))

    expect(mockModal.skipSimilarSelectAll).toHaveBeenCalled()
  })
})
