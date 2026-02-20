import { render, screen, fireEvent } from '@/tests/test-utils'
import SafeSelectionModal from './index'
import type { UseSafeSelectionModalReturn } from '../../hooks/useSafeSelectionModal'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('../../hooks/useSafeItemData', () => ({
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

const mockModal: UseSafeSelectionModalReturn = {
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
  open: jest.fn(),
  close: jest.fn(),
  toggleSelection: jest.fn(),
  selectAll: jest.fn(),
  deselectAll: jest.fn(),
  confirmSimilarAddress: jest.fn(),
  cancelSimilarAddress: jest.fn(),
  confirmSelectAll: jest.fn(),
  cancelSelectAll: jest.fn(),
  submitSelection: jest.fn(),
  setSearchQuery: jest.fn(),
}

describe('SafeSelectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should render modal when open', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    expect(screen.getByText('Manage trusted Safes')).toBeInTheDocument()
    expect(screen.getByText('Verify before you trust')).toBeInTheDocument()
  })

  it('should render safe items', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    // AccountItem uses checkbox data-testid format: safe-item-checkbox-{address}
    expect(screen.getByTestId('safe-item-checkbox-0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-checkbox-0xabcdef1234567890abcdef1234567890abcdef12')).toBeInTheDocument()
  })

  it('should call close when cancel clicked', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    fireEvent.click(screen.getByText('Cancel'))

    expect(mockModal.close).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    const closedModal = { ...mockModal, isOpen: false }
    const { container } = render(<SafeSelectionModal modal={closedModal} />)

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('should call toggleSelection when clicking safe item', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    // Click on the first safe item (AccountItem.Button has data-testid="safe-list-item")
    const safeItems = screen.getAllByTestId('safe-list-item')
    fireEvent.click(safeItems[0])

    expect(mockModal.toggleSelection).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678')
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

    render(<SafeSelectionModal modal={modalWithPending} />)

    expect(screen.getByText('Similar address detected')).toBeInTheDocument()
  })

  it('should display Select All and Deselect All buttons', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    expect(screen.getByText('Select All')).toBeInTheDocument()
    expect(screen.getByText('Deselect All')).toBeInTheDocument()
  })

  it('should call selectAll when Select All clicked', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    fireEvent.click(screen.getByText('Select All'))

    expect(mockModal.selectAll).toHaveBeenCalled()
  })

  it('should call deselectAll when Deselect All clicked', () => {
    render(<SafeSelectionModal modal={mockModal} />)

    fireEvent.click(screen.getByText('Deselect All'))

    expect(mockModal.deselectAll).toHaveBeenCalled()
  })

  it('should show selection count', () => {
    render(<SafeSelectionModal modal={mockModal} />)

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

    render(<SafeSelectionModal modal={modalWithSelectAllConfirmation} />)

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

    render(<SafeSelectionModal modal={modalWithSelectAllConfirmation} />)

    fireEvent.click(screen.getByText('Yes, include them anyway'))

    expect(mockModal.confirmSelectAll).toHaveBeenCalled()
  })

  it('should call cancelSelectAll when cancel clicked in select all dialog', () => {
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

    render(<SafeSelectionModal modal={modalWithSelectAllConfirmation} />)

    fireEvent.click(screen.getByText('No, skip similar addresses'))

    expect(mockModal.cancelSelectAll).toHaveBeenCalled()
  })
})
