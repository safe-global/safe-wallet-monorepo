import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditMemberDialog from '../EditMemberDialog'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const mockDispatch = jest.fn()
const mockUpdateAlias = jest.fn()
const mockUpdateRole = jest.fn()
const mockTrackEvent = jest.fn()
const mockAdminCount = jest.fn(() => 2)
const mockIsAdmin = jest.fn(() => true)
const mockCurrentUser = jest.fn<{ id: number } | undefined, []>(() => ({ id: 1 }))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => true,
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => true,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
  useAdminCount: () => mockAdminCount(),
  useIsAdmin: () => mockIsAdmin(),
  isActiveAdmin: (member: { role: string; status: string }) => member.role === 'ADMIN' && member.status === 'ACTIVE',
  getMemberDisplayName: (member: { alias?: string | null; name: string }) => member.alias || member.name,
  sanitizeMemberAlias: (value: string) => value.trim(),
  MEMBER_ALIAS_MAX_LENGTH: 30,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_MEMBER_ROLE_CHANGED: { action: 'Member role changed', category: 'spaces' },
    WORKSPACE_MEMBER_NAME_CHANGED: { action: 'Member name changed', category: 'spaces' },
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersUpdateAliasV1Mutation: () => [mockUpdateAlias],
  useMembersUpdateRoleV1Mutation: () => [mockUpdateRole],
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ currentData: mockCurrentUser() }),
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/tx/ErrorMessage', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
}))

// Lightweight stand-in for MemberInfoForm exposing the name/role fields it registers.
jest.mock('../../AddMemberModal/MemberInfoForm', () => ({
  __esModule: true,
  default: function MemberInfoForm({ disableName, disableRole }: { disableName?: boolean; disableRole?: boolean }) {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return (
      <>
        <input aria-label="Name" disabled={disableName} {...register('name')} />
        <select aria-label="Role" disabled={disableRole} {...register('role')}>
          <option value="ADMIN">Admin</option>
          <option value="MEMBER">Member</option>
        </select>
      </>
    )
  },
}))

const member: MemberDto = {
  id: 1,
  name: 'Alice',
  role: 'MEMBER',
  status: 'ACTIVE',
  invitedBy: null,
  createdAt: '',
  updatedAt: '',
  user: { id: 1, status: 'ACTIVE', email: null },
}

const submit = async () => {
  const submitButton = screen.getByRole('button', { name: 'Update' })
  await waitFor(() => expect(submitButton).not.toBeDisabled())
  fireEvent.click(submitButton)
}

const changeRoleAndSubmit = async () => {
  fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'ADMIN' } })
  await submit()
}

const changeNameAndSubmit = async (name: string) => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } })
  await submit()
}

describe('EditMemberDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAdminCount.mockReturnValue(2)
    mockIsAdmin.mockReturnValue(true)
    mockCurrentUser.mockReturnValue({ id: 1 })
    mockUpdateAlias.mockResolvedValue({})
    mockUpdateRole.mockResolvedValue({})
  })

  it('updates the alias when the current user renames themselves', async () => {
    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)
    await changeNameAndSubmit('Alice Admin')

    await waitFor(() =>
      expect(mockUpdateAlias).toHaveBeenCalledWith({
        spaceId: '42',
        updateMemberAliasDto: { alias: 'Alice Admin' },
      }),
    )
    expect(mockUpdateRole).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: expect.objectContaining({ message: 'Your name was updated' }) }),
    )
  })

  it('prefills the alias over the member name', () => {
    render(<EditMemberDialog member={{ ...member, alias: 'Ali' }} handleClose={jest.fn()} />)

    expect(screen.getByLabelText('Name')).toHaveValue('Ali')
  })

  it('disables the name field for members other than the current user', () => {
    mockCurrentUser.mockReturnValue({ id: 999 })

    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)

    expect(screen.getByLabelText('Name')).toBeDisabled()
  })

  it('locks the role for the last active admin but still allows renaming', async () => {
    mockAdminCount.mockReturnValue(1)

    render(<EditMemberDialog member={{ ...member, role: 'ADMIN' }} handleClose={jest.fn()} />)

    expect(screen.getByLabelText('Role')).toBeDisabled()

    await changeNameAndSubmit('Solo Admin')
    await waitFor(() => expect(mockUpdateAlias).toHaveBeenCalled())
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('disables the role for non-admin users but still allows renaming themselves', async () => {
    mockIsAdmin.mockReturnValue(false)

    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)

    expect(screen.getByLabelText('Role')).toBeDisabled()

    await changeNameAndSubmit('Alice Renamed')
    await waitFor(() => expect(mockUpdateAlias).toHaveBeenCalled())
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('updates the role and bubbles the backend error message when it fails', async () => {
    mockUpdateRole.mockResolvedValue({ error: { status: 422, data: { message: 'Role change not allowed' } } })

    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)
    await changeRoleAndSubmit()

    expect(await screen.findByText('Role change not allowed')).toBeInTheDocument()
    expect(mockUpdateRole).toHaveBeenCalled()
  })

  it('capitalizes the role in the success toast', async () => {
    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)
    await changeRoleAndSubmit()

    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ message: 'Updated role of Alice to Admin' }) }),
      ),
    )
  })

  it('falls back to a generic error when the backend provides no message', async () => {
    mockUpdateRole.mockResolvedValue({ error: { status: 500, data: {} } })

    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)
    await changeRoleAndSubmit()

    expect(await screen.findByText(/Something went wrong \(500\)/)).toBeInTheDocument()
  })
})
