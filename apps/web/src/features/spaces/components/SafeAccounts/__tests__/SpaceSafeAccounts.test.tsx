import { render, screen, fireEvent } from '@testing-library/react'
import { useLoadFeature } from '@/features/__core__'
import { useSpaceSafes, useIsAdmin, useIsInvited } from '@/features/spaces'
import { useSafeSelectionModal } from '@/features/myAccounts'
import SpaceSafeAccounts from '../index'

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: jest.fn(),
  useIsAdmin: jest.fn(),
  useIsInvited: jest.fn(),
  SpacesFeature: { name: 'spaces' },
}))

jest.mock('@/features/myAccounts', () => ({
  MyAccountsFeature: { name: 'myAccounts' },
  useSafeSelectionModal: jest.fn(),
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: jest.fn(),
}))

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(() => ({})),
}))

jest.mock('@/store/orderByPreferenceSlice', () => ({
  selectOrderByPreference: jest.fn(),
}))

jest.mock('@/store/addedSafesSlice', () => ({
  selectAllAddedSafes: jest.fn(),
}))

jest.mock('@/store/slices', () => ({
  selectAllAddressBooks: jest.fn(),
  selectAllVisitedSafes: jest.fn(),
  selectUndeployedSafes: jest.fn(),
}))

jest.mock('@/hooks/safes', () => ({
  _buildSafeItem: jest.fn(),
  _getMultiChainAccounts: jest.fn(() => []),
  _getSingleChainAccounts: jest.fn(() => []),
  getComparator: jest.fn(() => () => 0),
  useAllOwnedSafes: jest.fn(() => [{}]),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('@safe-global/utils/utils/addressSimilarity', () => ({
  getFlaggedSimilarAddressSet: jest.fn(() => new Set()),
}))

jest.mock('../AccountsSafesList', () => {
  const Mock = () => null
  Mock.displayName = 'MockAccountsSafesList'
  return Mock
})
jest.mock('../EmptySafeAccounts', () => {
  const Mock = () => null
  Mock.displayName = 'MockEmptySafeAccounts'
  return Mock
})
jest.mock('../../AddAccounts', () => {
  const Mock = () => <button data-testid="mock-add-accounts">Add Accounts</button>
  Mock.displayName = 'MockAddAccounts'
  return Mock
})
jest.mock('../../InviteBanner/PreviewInvite', () => {
  const Mock = () => null
  Mock.displayName = 'MockPreviewInvite'
  return Mock
})
jest.mock('@/components/common/Track', () => {
  const Track = ({ children }: { children: React.ReactNode }) => <>{children}</>
  Track.displayName = 'Track'
  return Track
})

const mockSafeSelectionModalOpen = jest.fn()
const baseModalReturn = {
  isOpen: false,
  availableItems: [],
  selectedAddresses: new Set<string>(),
  pendingConfirmation: null,
  pendingSelectAllConfirmation: false,
  similarAddressesForSelectAll: [],
  searchQuery: '',
  isLoading: false,
  hasChanges: false,
  totalSafesCount: 0,
  open: mockSafeSelectionModalOpen,
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

const MockSafeSelectionModal: jest.Mock = jest.fn((props: { modal: typeof baseModalReturn }) => {
  void props
  return null
})

describe('SpaceSafeAccounts – Manage trusted Safes entry point', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSpaceSafes as jest.Mock).mockReturnValue({
      allSafes: [],
      isError: false,
      error: null,
      refetch: jest.fn(),
    })
    ;(useIsInvited as jest.Mock).mockReturnValue(false)
    ;(useSafeSelectionModal as jest.Mock).mockReturnValue(baseModalReturn)
    ;(useLoadFeature as jest.Mock).mockReturnValue({ SafeSelectionModal: MockSafeSelectionModal })
  })

  it('renders the Manage trusted Safes button for non-admin members', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)

    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('manage-trusted-safes-button')).toBeInTheDocument()
    expect(screen.queryByTestId('mock-add-accounts')).not.toBeInTheDocument()
  })

  it('renders both Manage trusted Safes and Add Accounts buttons for admins', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)

    render(<SpaceSafeAccounts />)

    expect(screen.getByTestId('manage-trusted-safes-button')).toBeInTheDocument()
    expect(screen.getByTestId('mock-add-accounts')).toBeInTheDocument()
  })

  it('opens the trusted Safes modal when the button is clicked', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)

    render(<SpaceSafeAccounts />)
    fireEvent.click(screen.getByTestId('manage-trusted-safes-button'))

    expect(mockSafeSelectionModalOpen).toHaveBeenCalledTimes(1)
  })

  it('renders the SafeSelectionModal with the modal handle from useSafeSelectionModal', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)

    render(<SpaceSafeAccounts />)

    expect(MockSafeSelectionModal).toHaveBeenCalled()
    expect(MockSafeSelectionModal.mock.calls[0][0]).toMatchObject({ modal: baseModalReturn })
  })
})
