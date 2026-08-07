import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { showNotification } from '@/store/notificationsSlice'
import AddMemberModal from './index'

const mockSpaceId = '11111111-1111-1111-1111-111111111111'
const mockDispatch = jest.fn()
const mockInviteMembers = jest.fn()
const mockUseAuthGetMeV1Query = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseAddressBook = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_MEMBER_INVITE_SENT: { action: 'Workspace member invite sent', category: 'spaces' },
    ADD_MEMBER_MODAL: { action: 'Open add member modal', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => mockSpaceId,
  MemberRole: { MEMBER: 'MEMBER', ADMIN: 'ADMIN' },
  useAddressBookSearch: (contacts: { name: string; address: string }[], query: string) =>
    query
      ? contacts.filter(
          ({ name, address }) =>
            name.toLowerCase().includes(query.toLowerCase()) || address.toLowerCase().includes(query.toLowerCase()),
        )
      : contacts,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthGetMeV1Query: () => mockUseAuthGetMeV1Query(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => mockUseUsersGetWithWalletsV1Query(),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), pathname: '/spaces/members' }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => true,
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: Parameters<typeof showNotification>[0]) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersInviteUserV1Mutation: () => [mockInviteMembers],
}))

jest.mock('@/hooks/useAddressBook', () => ({
  __esModule: true,
  default: () => mockUseAddressBook(),
}))

jest.mock('./MemberInfoForm', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: { spaces: { members: '/spaces/members' } },
}))

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ name, address }: { name?: string; address: string }) => <div>{name ?? address}</div>,
}))

jest.mock('@/components/common/AddressInput/useNameResolver', () => ({
  __esModule: true,
  default: () => ({ address: undefined, resolverError: undefined, resolving: false }),
}))

describe('AddMemberModal tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuthGetMeV1Query.mockReturnValue({ data: undefined })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })
    mockUseAddressBook.mockReturnValue({})
  })

  it('tracks WORKSPACE_MEMBER_INVITE_SENT with workspace_id, user_id and role on submit', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [
        {
          userId: 1,
          spaceId: mockSpaceId,
          name: 'Alice',
          role: 'MEMBER',
          status: 'INVITED',
        },
      ],
    })

    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })

    const submitButton = screen.getByTestId('add-member-modal-button')
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: mockSpaceId },
        { workspace_id: mockSpaceId, user_id: 1, role: 'member' },
      )
    })
  })

  it('submits email invites with the email field instead of address', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 1, spaceId: mockSpaceId, name: 'invitee@example.com', role: 'MEMBER', status: 'INVITED' }],
    })

    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: 'invitee@example.com' },
    })

    const submitButton = screen.getByTestId('add-member-modal-button')
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: mockSpaceId,
        inviteUsersDto: {
          users: [{ type: 'email', email: 'invitee@example.com', role: 'MEMBER', name: '' }],
        },
      })
    })
  })

  it('limits the invitee identifier input to the allowed email max length', () => {
    render(<AddMemberModal onClose={jest.fn()} />)

    expect(screen.getByTestId('member-invitee-identifier-input')).toHaveAttribute('maxLength', '255')
  })

  it('shows an initials avatar for a valid email', async () => {
    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: 'invitee@example.com' },
    })

    await waitFor(() => expect(screen.getByText('i')).toBeInTheDocument())
  })

  it('shows an error for an invalid invitee identifier', async () => {
    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: 'not-a-wallet-or-email' },
    })

    await waitFor(() =>
      expect(screen.getByTestId('member-invitee-identifier-input')).toHaveAttribute('aria-invalid', 'true'),
    )
    expect(screen.getByTestId('add-member-modal-button')).toBeDisabled()
  })

  it("blocks inviting the authenticated user's email", async () => {
    mockUseAuthGetMeV1Query.mockReturnValue({
      data: { id: '1', authMethod: 'oidc', email: 'alice@example.com' },
    })

    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: 'ALICE@example.com' },
    })

    await waitFor(() =>
      expect(screen.getByTestId('member-invitee-identifier-input')).toHaveAttribute('aria-invalid', 'true'),
    )
    expect(screen.getByTestId('add-member-modal-button')).toBeDisabled()
  })

  it("blocks inviting one of the authenticated user's wallets", async () => {
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({
      currentData: {
        id: 1,
        wallets: [{ id: 1, address: '0x1234567890123456789012345678901234567890' }],
      },
    })

    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })

    await waitFor(() =>
      expect(screen.getByTestId('member-invitee-identifier-input')).toHaveAttribute('aria-invalid', 'true'),
    )
    expect(screen.getByTestId('add-member-modal-button')).toBeDisabled()
  })

  it('fills the address and name from an address book suggestion', async () => {
    const address = '0x1234567890123456789012345678901234567890'
    const name = 'Alice'

    mockUseAddressBook.mockReturnValue({ [address]: name })
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 1, spaceId: mockSpaceId, name, role: 'MEMBER', status: 'INVITED' }],
    })

    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-invitee-identifier-input'), {
      target: { value: 'Ali' },
    })
    fireEvent.click(await screen.findByRole('option', { name }))

    expect(screen.getByTestId('member-invitee-identifier-input')).toHaveValue(address)

    const submitButton = screen.getByTestId('add-member-modal-button')
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: mockSpaceId,
        inviteUsersDto: {
          users: [{ type: 'wallet', address, role: 'MEMBER', name }],
        },
      })
    })
  })
})
