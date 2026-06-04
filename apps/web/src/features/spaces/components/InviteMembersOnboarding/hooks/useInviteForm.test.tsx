import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import useInviteForm from './useInviteForm'

const mockInviteMembers = jest.fn()
const mockOnSuccess = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_MEMBER_INVITE_SENT: { action: 'Workspace member invite sent', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersInviteUserV1Mutation: () => [mockInviteMembers],
}))

jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  MemberRole: { MEMBER: 'MEMBER', ADMIN: 'ADMIN' },
}))

const TestComponent = ({ spaceId }: { spaceId: string | undefined }) => {
  const { onSubmit, register, fields, append } = useInviteForm(spaceId, mockOnSuccess)
  return (
    <form onSubmit={onSubmit}>
      {fields.map((field, index) => (
        <input key={field.id} data-testid={`address-${index}`} {...register(`members.${index}.identifier`)} />
      ))}
      <button type="button" data-testid="append" onClick={() => append({ identifier: '', role: MemberRole.MEMBER })}>
        Add
      </button>
      <button type="submit" data-testid="submit">
        Submit
      </button>
    </form>
  )
}

describe('useInviteForm tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks WORKSPACE_MEMBER_INVITE_SENT per member with workspace_id, user_id, role and batch_size on submit', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [
        {
          userId: 7,
          spaceId: '11111111-1111-1111-1111-111111111111',
          name: 'Alice',
          role: 'MEMBER',
          status: 'INVITED',
        },
      ],
    })

    render(<TestComponent spaceId="11111111-1111-1111-1111-111111111111" />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: 42,
        inviteUsersDto: {
          users: [
            {
              type: 'wallet',
              address: '0x1234567890123456789012345678901234567890',
              name: '0x1234567890123456789012345678901234567890',
              role: 'MEMBER',
            },
          ],
        },
      })
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: '11111111-1111-1111-1111-111111111111' },
        { workspace_id: '11111111-1111-1111-1111-111111111111', user_id: 7, role: 'member', batch_size: 1 },
      )
    })
  })

  it('builds an email invite payload with a lowercased email', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 9, spaceId: 42, name: 'Bob@Example.com', role: 'MEMBER', status: 'INVITED' }],
    })

    render(<TestComponent spaceId="42" />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: 'Bob@Example.com' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: 42,
        inviteUsersDto: {
          users: [
            {
              type: 'email',
              email: 'bob@example.com',
              name: 'Bob@Example.com',
              role: 'MEMBER',
            },
          ],
        },
      })
    })
  })

  it('submits identifiers with surrounding whitespace instead of blocking on "unresolved" names', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 3, spaceId: 42, name: 'Dave', role: 'MEMBER', status: 'INVITED' }],
    })

    render(<TestComponent spaceId="42" />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '  Dave@Example.com  ' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: 42,
        inviteUsersDto: {
          users: [
            {
              type: 'email',
              email: 'dave@example.com',
              name: 'Dave@Example.com',
              role: 'MEMBER',
            },
          ],
        },
      })
    })
  })

  it('builds a mixed payload of wallet and email invites in order', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [
        { userId: 1, spaceId: 42, name: 'wallet', role: 'MEMBER', status: 'INVITED' },
        { userId: 2, spaceId: 42, name: 'email', role: 'MEMBER', status: 'INVITED' },
      ],
    })

    render(<TestComponent spaceId="42" />)

    fireEvent.click(screen.getByTestId('append'))

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.change(screen.getByTestId('address-1'), {
      target: { value: 'Carol@Example.com' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: 42,
        inviteUsersDto: {
          users: [
            {
              type: 'wallet',
              address: '0x1234567890123456789012345678901234567890',
              name: '0x1234567890123456789012345678901234567890',
              role: 'MEMBER',
            },
            {
              type: 'email',
              email: 'carol@example.com',
              name: 'Carol@Example.com',
              role: 'MEMBER',
            },
          ],
        },
      })
      expect(trackEvent).toHaveBeenCalledTimes(2)
    })
  })
})
