import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditMemberDialog from '../EditMemberDialog'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const mockDispatch = jest.fn()
const mockEditMember = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: { WORKSPACE_MEMBER_ROLE_CHANGED: { action: 'Member role changed', category: 'spaces' } },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersUpdateRoleV1Mutation: () => [mockEditMember],
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/tx/ErrorMessage', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
}))

jest.mock('../../AddMemberModal/MemberInfoForm', () => ({
  __esModule: true,
  default: function MemberInfoForm() {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return (
      <select aria-label="Role" {...register('role')}>
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </select>
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

const changeRoleAndSubmit = async () => {
  fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'ADMIN' } })
  const submitButton = screen.getByRole('button', { name: 'Update' })
  await waitFor(() => expect(submitButton).not.toBeDisabled())
  fireEvent.click(submitButton)
}

describe('EditMemberDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('bubbles the backend error message when editing the member fails', async () => {
    mockEditMember.mockResolvedValue({ error: { status: 422, data: { message: 'Role change not allowed' } } })

    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)
    await changeRoleAndSubmit()

    expect(await screen.findByText('Role change not allowed')).toBeInTheDocument()
  })

  it('falls back to a generic error when the backend provides no message', async () => {
    mockEditMember.mockResolvedValue({ error: { status: 500, data: {} } })

    render(<EditMemberDialog member={member} handleClose={jest.fn()} />)
    await changeRoleAndSubmit()

    expect(await screen.findByText(/Something went wrong \(500\)/)).toBeInTheDocument()
  })
})
