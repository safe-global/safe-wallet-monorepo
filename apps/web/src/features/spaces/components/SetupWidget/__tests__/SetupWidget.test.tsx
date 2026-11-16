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

const mockDismiss = jest.fn()
const mockUseSetupWidgetDismissal = jest.fn(() => ({ isDismissed: false, dismiss: mockDismiss }))

jest.mock('../useSetupWidgetDismissal', () => ({
  useSetupWidgetDismissal: () => mockUseSetupWidgetDismissal(),
}))

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn(() => [{}, jest.fn()]),
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

const setStepData = ({
  addressBook = [] as unknown[],
  safes = [] as unknown[],
  activeMembers = [] as unknown[],
  invitedMembers = [] as unknown[],
}) => {
  ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue(addressBook)
  ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: safes })
  ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({ activeMembers, invitedMembers })
}

describe('SetupWidget', () => {
  beforeEach(() => {
    mockDismiss.mockClear()
    mockUseSetupWidgetDismissal.mockReturnValue({ isDismissed: false, dismiss: mockDismiss })

    const useLocalStorage = jest.requireMock<{ default: jest.Mock }>('@/services/local-storage/useLocalStorage')
    useLocalStorage.default.mockImplementation(() => [{}, jest.fn()])

    setStepData({})
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

  it('hides the widget and records the dismissal when dismiss is clicked', async () => {
    const onDismiss = jest.fn()
    render(<SetupWidget onDismiss={onDismiss} />)

    fireEvent.click(screen.getByText('Dismiss'))

    await waitFor(
      () => {
        expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
      },
      { timeout: 3000 },
    )
    await waitFor(() => expect(mockDismiss).toHaveBeenCalledTimes(1))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not render when dismissed for the space', () => {
    mockUseSetupWidgetDismissal.mockReturnValue({ isDismissed: true, dismiss: mockDismiss })

    render(<SetupWidget />)

    expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
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
    setStepData({ addressBook: [{ name: 'Alice', address: '0x1' }], safes: [{ address: '0x2', chainId: '1' }] })

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

  it('does not render once the three setup steps are completed', () => {
    setStepData({
      addressBook: [{ name: 'Alice', address: '0x1' }],
      safes: [{ address: '0x2', chainId: '1' }],
      activeMembers: [{ id: '1' }],
      invitedMembers: [{ id: '2' }],
    })

    render(<SetupWidget />)

    expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
  })

  it('still renders when only some setup steps are completed', () => {
    setStepData({ addressBook: [{ name: 'Alice', address: '0x1' }], safes: [{ address: '0x2', chainId: '1' }] })

    render(<SetupWidget />)

    expect(screen.getByText('Set up your Workspace')).toBeInTheDocument()
  })

  it('does not render when the space was marked completed before', () => {
    const useLocalStorage = jest.requireMock<{ default: jest.Mock }>('@/services/local-storage/useLocalStorage')
    useLocalStorage.default.mockImplementation((key: string) =>
      key === 'setupWidgetCompleted' ? [{ '1': true }, jest.fn()] : [{}, jest.fn()],
    )

    render(<SetupWidget />)

    expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
  })

  it('disables click on completed steps', () => {
    setStepData({ addressBook: [{ name: 'Alice', address: '0x1' }], safes: [{ address: '0x2', chainId: '1' }] })

    render(<SetupWidget />)

    fireEvent.click(screen.getByText('Import your address book'))

    expect(screen.queryByTestId('import-address-book-dialog')).not.toBeInTheDocument()
  })
})
