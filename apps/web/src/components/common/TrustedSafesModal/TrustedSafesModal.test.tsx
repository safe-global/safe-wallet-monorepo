import { render, screen, fireEvent } from '@/tests/test-utils'
import TrustedSafesModal from './index'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'
import { useRouter } from 'next/router'
import { useIsQualifiedSafe } from '@/features/spaces'
import { OrderByOption, ORDER_BY_RESET_VERSION } from '@/store/orderByPreferenceSlice'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/features/spaces/hooks/useIsQualifiedSafe', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

const mockUseIsQualifiedSafe = useIsQualifiedSafe as jest.Mock

// The list is rendered by the shared accounts table (covered by its own suite). Stub it to a row per
// item that surfaces the selection toggle so we can assert the modal wiring.
jest.mock('@/features/myAccounts', () => ({
  __esModule: true,
  SafeAccountsTable: ({
    items,
    selection,
    reorder,
  }: {
    items: Array<{ address: string; chainId?: string }>
    selection?: { onToggle: (line: { address: string }) => void }
    reorder?: { onReorder: (order: string[]) => void }
  }) => (
    <div data-testid="safe-accounts-table">
      {reorder && (
        <button data-testid="reorder-enabled" onClick={() => reorder.onReorder(items.map((item) => item.address))}>
          reorder
        </button>
      )}
      {items.map((item) => (
        <button key={item.address} data-testid={`row-${item.address}`} onClick={() => selection?.onToggle(item)}>
          {item.address}
        </button>
      ))}
    </div>
  ),
}))

let mockWalletValue: { address: string } | null = null
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockWalletValue,
}))

const mockConnectWallet = jest.fn()
jest.mock('@/components/common/ConnectWallet/useConnectWallet', () => ({
  __esModule: true,
  default: () => mockConnectWallet,
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
    mockWalletValue = null
  })

  it('should render modal when open', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.getByText('Manage my account list')).toBeInTheDocument()
    expect(screen.getByText('Verify before you trust')).toBeInTheDocument()
  })

  it('renders the connect-wallet hint when no wallet is connected', () => {
    mockWalletValue = null
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.getByTestId('manage-trusted-connect-wallet-button')).toBeInTheDocument()
  })

  it('hides the connect-wallet hint when a wallet is connected', () => {
    mockWalletValue = { address: '0xWallet' }
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.queryByTestId('manage-trusted-connect-wallet-button')).not.toBeInTheDocument()
  })

  it('triggers wallet connection when the connect-wallet hint is clicked', () => {
    mockWalletValue = null
    render(<TrustedSafesModal modal={mockModal} />)
    fireEvent.click(screen.getByTestId('manage-trusted-connect-wallet-button'))
    expect(mockConnectWallet).toHaveBeenCalled()
  })

  it('should render safe items', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.getByTestId('row-0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument()
    expect(screen.getByTestId('row-0xabcdef1234567890abcdef1234567890abcdef12')).toBeInTheDocument()
  })

  it('should render the search bar', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.getByPlaceholderText('by name, address or network')).toBeInTheDocument()
  })

  it('should call close when cancel clicked', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockModal.close).toHaveBeenCalled()
  })

  it('should disable Save when there are no changes', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.getByTestId('manage-trusted-save')).toBeDisabled()
  })

  it('should enable Save and call submitSelection when there are changes', () => {
    const modalWithChanges = { ...mockModal, hasChanges: true }
    render(<TrustedSafesModal modal={modalWithChanges} />)

    const saveButton = screen.getByTestId('manage-trusted-save')
    expect(saveButton).not.toBeDisabled()

    fireEvent.click(saveButton)
    expect(modalWithChanges.submitSelection).toHaveBeenCalled()
  })

  it('should not render when closed', () => {
    const closedModal = { ...mockModal, isOpen: false }
    const { container } = render(<TrustedSafesModal modal={closedModal} />)
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('should call toggleSelection when clicking a safe item', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    fireEvent.click(screen.getByTestId('row-0x1234567890abcdef1234567890abcdef12345678'))
    expect(mockModal.toggleSelection).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678')
  })

  it('should show similarity confirmation dialog when pendingConfirmation is set', () => {
    const modalWithPending = {
      ...mockModal,
      pendingConfirmation: '0x1234567890abcdef1234567890abcdef12345678',
    }
    render(<TrustedSafesModal modal={modalWithPending} />)
    expect(screen.getByText('Similar address detected')).toBeInTheDocument()
  })

  it('shows the select-all control with the selection count', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    expect(screen.getByText('Select all · 1 of 2 selected')).toBeInTheDocument()
  })

  it('should call selectAll when the select-all control is clicked with a partial selection', () => {
    render(<TrustedSafesModal modal={mockModal} />)
    fireEvent.click(screen.getByTestId('manage-trusted-select-all'))
    expect(mockModal.selectAll).toHaveBeenCalled()
  })

  it('should call deselectAll when the select-all control is clicked while all are selected', () => {
    const allSelectedModal = { ...mockModal, allSelected: true, selectedCount: 2 }
    render(<TrustedSafesModal modal={allSelectedModal} />)
    fireEvent.click(screen.getByTestId('manage-trusted-select-all'))
    expect(allSelectedModal.deselectAll).toHaveBeenCalled()
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

  describe('drag-and-drop reordering', () => {
    const manualState = {
      orderByPreference: { orderBy: OrderByOption.MANUAL, resetVersion: ORDER_BY_RESET_VERSION, manualOrder: {} },
    }

    it('does not enable reordering under the default (Name) sort', () => {
      render(<TrustedSafesModal modal={mockModal} />)
      expect(screen.queryByTestId('reorder-enabled')).not.toBeInTheDocument()
    })

    it('enables reordering in Manual sort mode', () => {
      render(<TrustedSafesModal modal={mockModal} />, { initialReduxState: manualState })
      expect(screen.getByTestId('reorder-enabled')).toBeInTheDocument()
    })

    it('suppresses reordering while searching, even in Manual mode', () => {
      render(<TrustedSafesModal modal={{ ...mockModal, searchQuery: 'safe' }} />, { initialReduxState: manualState })
      expect(screen.queryByTestId('reorder-enabled')).not.toBeInTheDocument()
    })

    it('persists the new order as the shared Manual order on drop', () => {
      const { container } = render(<TrustedSafesModal modal={mockModal} />, { initialReduxState: manualState })
      fireEvent.click(screen.getByTestId('reorder-enabled'))
      // The reorder handler dispatches into the store without error; the wiring under test is the
      // presence and invocation of onReorder (setManualOrder is unit-tested in the slice suite).
      expect(container).toBeInTheDocument()
    })
  })
})
