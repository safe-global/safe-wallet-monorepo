import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import EditMemberDialog from './EditMemberDialog'

const mockDispatch = jest.fn()
const mockUpdateRole = jest.fn()
const mockUpdateAlias = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_MEMBER_ROLE_CHANGED: { action: 'Workspace member role changed', category: 'spaces' },
    WORKSPACE_MEMBER_NAME_CHANGED: { action: 'Workspace member name changed', category: 'spaces' },
  },
}))

jest.mock('@/features/spaces', () => ({
  ...jest.requireActual('@/features/spaces'),
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersUpdateRoleV1Mutation: () => [mockUpdateRole],
  useMembersUpdateAliasV1Mutation: () => [mockUpdateAlias],
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/tx/ErrorMessage', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Minimal form bound to react-hook-form so we can drive name/role and read disabled state.
// Reading formState mirrors the real NameInput's subscription, which keeps isValid recomputing.
jest.mock('../AddMemberModal/MemberInfoForm', () => ({
  __esModule: true,
  default: ({ disableName, disableRole }: { disableName?: boolean; disableRole?: boolean }) => {
    const { register, formState } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return (
      <>
        <input {...register('name')} data-testid="member-name-input" disabled={disableName} />
        <input {...register('role')} data-testid="member-role-input" disabled={disableRole} />
        <span data-testid="form-valid" hidden>
          {String(formState.isValid)}
        </span>
      </>
    )
  },
}))

describe('EditMemberDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateRole.mockResolvedValue({ error: undefined })
    mockUpdateAlias.mockResolvedValue({ error: undefined })
  })

  const member = memberBuilder()
    .with({ name: 'Treasry Dev Inc creator', role: 'ADMIN', user: memberUserBuilder().with({ id: 7 }).build() })
    .build()

  // The Update button enables only after react-hook-form's async validation pass
  const clickUpdate = async () => {
    const button = screen.getByTestId('update-btn')
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
  }

  it('lets the current user rename themselves via the alias endpoint', async () => {
    render(<EditMemberDialog member={member} handleClose={jest.fn()} isCurrentUser />)

    const nameInput = screen.getByTestId('member-name-input') as HTMLInputElement
    expect(nameInput.disabled).toBe(false)

    fireEvent.change(nameInput, { target: { value: '  Alice  ' } })
    await clickUpdate()

    await waitFor(() => {
      expect(mockUpdateAlias).toHaveBeenCalledWith({
        spaceId: '42',
        updateMemberAliasDto: { alias: 'Alice' },
      })
    })
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('disables the name field for other members and only updates the role', async () => {
    render(<EditMemberDialog member={member} handleClose={jest.fn()} isCurrentUser={false} />)

    const nameInput = screen.getByTestId('member-name-input') as HTMLInputElement
    expect(nameInput.disabled).toBe(true)

    fireEvent.change(screen.getByTestId('member-role-input'), { target: { value: 'MEMBER' } })
    await clickUpdate()

    await waitFor(() => {
      expect(mockUpdateRole).toHaveBeenCalledWith({
        spaceId: '42',
        userId: 7,
        updateRoleDto: { role: 'MEMBER' },
      })
    })
    expect(mockUpdateAlias).not.toHaveBeenCalled()
  })

  it('allows the last admin to rename themselves while their role stays locked', async () => {
    render(<EditMemberDialog member={member} handleClose={jest.fn()} isCurrentUser disableRole />)

    expect((screen.getByTestId('member-role-input') as HTMLInputElement).disabled).toBe(true)

    fireEvent.change(screen.getByTestId('member-name-input'), { target: { value: 'New name' } })
    await clickUpdate()

    await waitFor(() => {
      expect(mockUpdateAlias).toHaveBeenCalledWith({
        spaceId: '42',
        updateMemberAliasDto: { alias: 'New name' },
      })
    })
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('shows the self-worded toast and skips the alias endpoint when the current user only changes their role', async () => {
    const handleClose = jest.fn()
    render(<EditMemberDialog member={member} handleClose={handleClose} isCurrentUser />)

    fireEvent.change(screen.getByTestId('member-role-input'), { target: { value: 'MEMBER' } })
    await clickUpdate()

    await waitFor(() => {
      expect(mockUpdateRole).toHaveBeenCalledWith({
        spaceId: '42',
        userId: 7,
        updateRoleDto: { role: 'MEMBER' },
      })
    })
    expect(mockUpdateAlias).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledTimes(1)
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'notifications/show',
      payload: expect.objectContaining({ message: 'Updated your role to MEMBER' }),
    })
    expect(handleClose).toHaveBeenCalled()
  })

  it('shows an error and does not PATCH when the name is whitespace-only', async () => {
    const handleClose = jest.fn()
    render(<EditMemberDialog member={member} handleClose={handleClose} isCurrentUser />)

    fireEvent.change(screen.getByTestId('member-name-input'), { target: { value: '   ' } })
    await clickUpdate()

    await waitFor(() => {
      expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument()
    })
    expect(mockUpdateAlias).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('shows a distinguished error and no name toast when the role saved but renaming failed', async () => {
    mockUpdateAlias.mockResolvedValue({ error: { status: 500, data: {} } })
    const handleClose = jest.fn()

    render(<EditMemberDialog member={member} handleClose={handleClose} isCurrentUser />)

    fireEvent.change(screen.getByTestId('member-role-input'), { target: { value: 'MEMBER' } })
    fireEvent.change(screen.getByTestId('member-name-input'), { target: { value: 'Alice' } })
    await clickUpdate()

    await waitFor(() => {
      expect(screen.getByText('The role was updated, but renaming failed. Please try again.')).toBeInTheDocument()
    })

    // No success toast should be dispatched, and the dialog stays open
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('does not update the name or show any success toast when the role update fails first', async () => {
    mockUpdateRole.mockResolvedValue({ error: { status: 500, data: {} } })
    const handleClose = jest.fn()

    render(<EditMemberDialog member={member} handleClose={handleClose} isCurrentUser />)

    fireEvent.change(screen.getByTestId('member-role-input'), { target: { value: 'MEMBER' } })
    fireEvent.change(screen.getByTestId('member-name-input'), { target: { value: 'Alice' } })
    await clickUpdate()

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred while updating the role.')).toBeInTheDocument()
    })

    // Role failed first, so the alias is never touched and no success toast fires
    expect(mockUpdateAlias).not.toHaveBeenCalled()
    expect(mockDispatch).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('surfaces the backend error message when a mutation fails', async () => {
    mockUpdateAlias.mockResolvedValue({ error: { status: 400, data: { message: 'Alias already taken' } } })

    render(<EditMemberDialog member={member} handleClose={jest.fn()} isCurrentUser />)

    fireEvent.change(screen.getByTestId('member-name-input'), { target: { value: 'Alice' } })
    await clickUpdate()

    await waitFor(() => {
      expect(screen.getByText('Alias already taken')).toBeInTheDocument()
    })
  })
})
