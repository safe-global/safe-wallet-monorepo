import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { useSpaceMembersByStatus } from '@/features/spaces/hooks/useSpaceMembers'
import useGetSpaceAddressBook from '@/features/spaces/hooks/useGetSpaceAddressBook'
import SetupWidget from '../index'

jest.mock('@/features/spaces/hooks/useSpaceSafes', () => ({
  useSpaceSafes: jest.fn(() => ({ allSafes: [] })),
}))
jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  get MemberStatus() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').MemberStatus
  },
  get MemberRole() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').MemberRole
  },
  get MEMBER_ALIAS_MAX_LENGTH() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').MEMBER_ALIAS_MAX_LENGTH
  },
  get getMemberDisplayName() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').getMemberDisplayName
  },
  get sanitizeMemberAlias() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').sanitizeMemberAlias
  },
  get isAdmin() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').isAdmin
  },
  get isActiveAdmin() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').isActiveAdmin
  },
  get isInviteExpired() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').isInviteExpired
  },
  get useCurrentMembership() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').useCurrentMembership
  },
  get useCurrentMemberProfile() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').useCurrentMemberProfile
  },
  get useIsActiveMember() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').useIsActiveMember
  },
  get useIsAdmin() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').useIsAdmin
  },
  get useIsInvited() {
    return jest.requireActual('@/features/spaces/hooks/useSpaceMembers').useIsInvited
  },
  useSpaceMembersByStatus: jest.fn(() => ({ activeMembers: [], invitedMembers: [] })),
}))
jest.mock('@/features/spaces/hooks/useGetSpaceAddressBook', () => ({
  ...jest.requireActual('@/features/spaces/hooks/useGetSpaceAddressBook'),
  __esModule: true,
  default: jest.fn(() => []),
}))
jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: jest.fn(() => '1'),
}))

const mockSetDismissedSpaces = jest.fn()
const mockSetCompletedSpaces = jest.fn()

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn((key: string) => {
    if (key === 'setupWidgetCompleted') {
      return [{}, mockSetCompletedSpaces]
    }
    return [{}, mockSetDismissedSpaces]
  }),
}))

jest.mock('@/hooks/safes/useAllSafesGrouped', () => ({
  ...jest.requireActual('@/hooks/safes/useAllSafesGrouped'),
  flattenSafeItems: jest.fn((items: unknown[]) => items),
}))
jest.mock('@/hooks/safes/isMultiChainSafeItem', () => ({
  isMultiChainSafeItem: jest.fn(() => false),
}))

jest.mock(
  '../../SpaceAddressBook/Import/ImportAddressBookDialog',
  () =>
    function MockImportAddressBookDialog() {
      return <div data-testid="import-address-book-dialog" />
    },
)

jest.mock(
  '../../AddAccounts',
  () =>
    function MockAddAccounts({ externalOpen }: { externalOpen?: boolean }) {
      return externalOpen ? <div data-testid="add-accounts-dialog" /> : null
    },
)

jest.mock(
  '../../SpaceInfoModal',
  () =>
    function MockSpaceInfoModal({ onClose }: { onClose: () => void }) {
      return (
        <div data-testid="space-info-modal">
          <button data-testid="close-space-info-modal" onClick={onClose}>
            Close
          </button>
        </div>
      )
    },
)

describe('SetupWidget', () => {
  beforeEach(() => {
    mockSetDismissedSpaces.mockClear()
    mockSetCompletedSpaces.mockClear()

    const useLocalStorage = jest.requireMock<{ default: jest.Mock }>('@/services/local-storage/useLocalStorage')
    useLocalStorage.default.mockImplementation((key: string) => {
      if (key === 'setupWidgetCompleted') {
        return [{}, mockSetCompletedSpaces]
      }
      return [{}, mockSetDismissedSpaces]
    })

    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([])
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [] })
    ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({ activeMembers: [], invitedMembers: [] })
  })

  it('renders the widget title', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Set up your Workspace')).toBeInTheDocument()
  })

  it('renders all four setup steps', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Import your address book')).toBeInTheDocument()
    expect(screen.getByText('Add your Safe accounts')).toBeInTheDocument()
    expect(screen.getByText('Invite team members')).toBeInTheDocument()
    expect(screen.getByText('Explore Workspaces')).toBeInTheDocument()
  })

  it('renders the dismiss button', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Dismiss')).toBeInTheDocument()
  })

  it('hides the widget when dismiss is clicked', async () => {
    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Dismiss'))

    await waitFor(
      () => {
        expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })

  it('opens the import address book dialog when step is clicked', () => {
    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Import your address book'))

    expect(screen.getByTestId('import-address-book-dialog')).toBeInTheDocument()
  })

  it('renders the test id', () => {
    render(<SetupWidget />)

    expect(screen.getByTestId('space-dashboard-setup-widget')).toBeInTheDocument()
  })

  it('sorts completed steps before incomplete ones', () => {
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([{ name: 'Alice', address: '0x1' }])
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [{ address: '0x2', chainId: '1' }] })
    ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({ activeMembers: [], invitedMembers: [] })

    render(<SetupWidget />)

    const allStepLabels = [
      'Import your address book',
      'Add your Safe accounts',
      'Invite team members',
      'Explore Workspaces',
    ]
    const steps = screen
      .getAllByRole('button')
      .filter((el) => allStepLabels.some((label) => el.textContent?.includes(label)))

    // Completed steps should appear before incomplete ones
    expect(steps[0]).toHaveTextContent('Import your address book')
    expect(steps[1]).toHaveTextContent('Add your Safe accounts')
    expect(steps[2]).toHaveTextContent('Invite team members')
    expect(steps[3]).toHaveTextContent('Explore Workspaces')
  })

  it('opens the Introducing Spaces modal when Explore Spaces is clicked', () => {
    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Explore Workspaces'))

    expect(screen.getByTestId('space-info-modal')).toBeInTheDocument()
  })

  it('marks the space as completed when Explore Spaces modal is closed and all steps are done', () => {
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([{ name: 'Alice', address: '0x1' }])
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [{ address: '0x2', chainId: '1' }] })
    ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({
      activeMembers: [{ id: '1' }, { id: '2' }],
      invitedMembers: [],
    })

    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Explore Workspaces'))
    expect(screen.getByTestId('space-info-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('close-space-info-modal'))

    expect(mockSetCompletedSpaces).toHaveBeenCalledWith(expect.any(Function))

    const updaterFn = mockSetCompletedSpaces.mock.calls[0][0]
    const result = updaterFn({})
    expect(result).toEqual({ '1': true })
  })

  it('does not mark the space as completed when Explore Spaces modal is closed but steps are incomplete', () => {
    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Explore Workspaces'))
    expect(screen.getByTestId('space-info-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('close-space-info-modal'))

    expect(mockSetCompletedSpaces).not.toHaveBeenCalled()
  })

  it('does not render when the space setup is completed', () => {
    const useLocalStorage = jest.requireMock<{ default: jest.Mock }>('@/services/local-storage/useLocalStorage')

    useLocalStorage.default.mockImplementation((key: string) => {
      if (key === 'setupWidgetCompleted') {
        return [{ '1': true }, mockSetCompletedSpaces]
      }
      return [{}, mockSetDismissedSpaces]
    })

    render(<SetupWidget />)

    expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
  })

  it('disables click on completed steps', () => {
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([{ name: 'Alice', address: '0x1' }])
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [{ address: '0x2', chainId: '1' }] })

    render(<SetupWidget />)

    // Click the completed "Import your address book" step
    fireEvent.click(screen.getByText('Import your address book'))

    // Dialog should NOT open since the step is completed
    expect(screen.queryByTestId('import-address-book-dialog')).not.toBeInTheDocument()
  })
})
