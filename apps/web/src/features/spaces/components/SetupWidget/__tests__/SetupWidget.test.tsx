import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import type * as SpacesModule from '@/features/spaces'
import SetupWidget from '../index'

jest.mock('@/features/spaces', () => ({
  useSpaceSafes: jest.fn(() => ({ allSafes: [] })),
  useSpaceMembersByStatus: jest.fn(() => ({ activeMembers: [], invitedMembers: [] })),
  useGetSpaceAddressBook: jest.fn(() => []),
  useCurrentSpaceId: jest.fn(() => '1'),
}))

const mockDismiss = jest.fn()
const mockMarkCompleted = jest.fn()
let mockIsHidden = false

jest.mock('../useSetupWidgetState', () => ({
  __esModule: true,
  default: () => ({ isHidden: mockIsHidden, dismiss: mockDismiss, markCompleted: mockMarkCompleted }),
}))

jest.mock('@/hooks/safes', () => ({
  flattenSafeItems: jest.fn((items: unknown[]) => items),
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
  '../../AddMemberModal',
  () =>
    function MockAddMemberModal() {
      return <div data-testid="add-member-modal" />
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

const mockAllStepsDone = () => {
  const { useSpaceSafes, useSpaceMembersByStatus, useGetSpaceAddressBook } =
    jest.requireMock<typeof SpacesModule>('@/features/spaces')

  ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([{ name: 'Alice', address: '0x1' }])
  ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [{ address: '0x2', chainId: '1' }] })
  ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({
    activeMembers: [{ id: '1' }, { id: '2' }],
    invitedMembers: [],
  })
}

describe('SetupWidget', () => {
  beforeEach(() => {
    mockDismiss.mockClear()
    mockMarkCompleted.mockClear()
    mockIsHidden = false

    const { useSpaceSafes, useSpaceMembersByStatus, useGetSpaceAddressBook } =
      jest.requireMock<typeof SpacesModule>('@/features/spaces')

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

  it('hides the widget and records the dismiss when dismiss is clicked', async () => {
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
    const { useSpaceSafes, useSpaceMembersByStatus, useGetSpaceAddressBook } =
      jest.requireMock<typeof SpacesModule>('@/features/spaces')

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

  it('hides and marks the space as completed once all three steps are done', () => {
    mockAllStepsDone()

    render(<SetupWidget />)

    expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
    expect(mockMarkCompleted).toHaveBeenCalledTimes(1)
  })

  it('does not mark the space as completed while loading', () => {
    mockAllStepsDone()

    render(<SetupWidget loading />)

    expect(mockMarkCompleted).not.toHaveBeenCalled()
  })

  it('does not mark the space as completed while steps are incomplete', () => {
    render(<SetupWidget />)

    expect(screen.getByText('Set up your Workspace')).toBeInTheDocument()
    expect(mockMarkCompleted).not.toHaveBeenCalled()
  })

  it('keeps an open modal mounted when the last step gets completed', async () => {
    const { useSpaceSafes, useGetSpaceAddressBook } = jest.requireMock<typeof SpacesModule>('@/features/spaces')
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([{ name: 'Alice', address: '0x1' }])
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [{ address: '0x2', chainId: '1' }] })

    const { rerender } = render(<SetupWidget />)
    fireEvent.click(screen.getByText('Invite team members'))
    expect(screen.getByTestId('add-member-modal')).toBeInTheDocument()

    mockAllStepsDone()
    rerender(<SetupWidget />)

    await waitFor(() => expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument())
    expect(screen.getByTestId('add-member-modal')).toBeInTheDocument()
    expect(mockDismiss).not.toHaveBeenCalled()
  })

  it('does not render when the widget is hidden for the space', () => {
    mockIsHidden = true

    render(<SetupWidget />)

    expect(screen.queryByText('Set up your Workspace')).not.toBeInTheDocument()
  })

  it('disables click on completed steps', () => {
    const { useSpaceSafes, useGetSpaceAddressBook } = jest.requireMock<typeof SpacesModule>('@/features/spaces')

    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([{ name: 'Alice', address: '0x1' }])
    ;(useSpaceSafes as jest.Mock).mockReturnValue({ allSafes: [{ address: '0x2', chainId: '1' }] })

    render(<SetupWidget />)

    // Click the completed "Import your address book" step
    fireEvent.click(screen.getByText('Import your address book'))

    // Dialog should NOT open since the step is completed
    expect(screen.queryByTestId('import-address-book-dialog')).not.toBeInTheDocument()
  })
})
