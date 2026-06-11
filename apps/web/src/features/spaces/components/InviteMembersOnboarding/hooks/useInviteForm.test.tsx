import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import useInviteForm, { toInviteName } from './useInviteForm'

const mockSpaceId = '11111111-1111-1111-1111-111111111111'
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
  const { onSubmit, register, fields, append, isSubmitting } = useInviteForm(spaceId, mockOnSuccess)
  return (
    <form onSubmit={onSubmit}>
      {fields.map((field, index) => (
        <input key={field.id} data-testid={`address-${index}`} {...register(`members.${index}.identifier`)} />
      ))}
      <button type="button" data-testid="append" onClick={() => append({ identifier: '', role: MemberRole.MEMBER })}>
        Add
      </button>
      <button type="submit" data-testid="submit" disabled={isSubmitting}>
        Submit
      </button>
      <span data-testid="is-submitting">{String(isSubmitting)}</span>
    </form>
  )
}

describe('toInviteName', () => {
  it('keeps wallet addresses and ENS names as-is', () => {
    expect(toInviteName('0x1234567890123456789012345678901234567890')).toBe(
      '0x1234567890123456789012345678901234567890',
    )
    expect(toInviteName('alice.eth')).toBe('alice.eth')
  })

  it('derives the name from the email local part', () => {
    expect(toInviteName('john.doe@example.com')).toBe('john.doe')
  })

  it('strips characters the backend name validation rejects', () => {
    expect(toInviteName('john+safe@example.com')).toBe('johnsafe')
  })

  it('strips leading non-alphanumeric characters', () => {
    expect(toInviteName('_test@example.com')).toBe('test')
  })

  it('falls back to a default when nothing valid remains', () => {
    expect(toInviteName('+++@example.com')).toBe('Member')
  })
})

describe('useInviteForm tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks WORKSPACE_MEMBER_INVITE_SENT per member with workspace_id, user_id, role and batch_size on submit', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [
        {
          userId: 7,
          spaceId: mockSpaceId,
          name: 'Alice',
          role: 'MEMBER',
          status: 'INVITED',
        },
      ],
    })

    render(<TestComponent spaceId={mockSpaceId} />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: mockSpaceId,
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
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: mockSpaceId },
        { workspace_id: mockSpaceId, user_id: 7, role: 'member', batch_size: 1 },
      )
    })
  })

  it('builds an email invite payload with a lowercased email and a name derived from the local part', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 9, spaceId: mockSpaceId, name: 'Bob', role: 'MEMBER', status: 'INVITED' }],
    })

    render(<TestComponent spaceId={mockSpaceId} />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: 'Bob@Example.com' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: mockSpaceId,
        inviteUsersDto: {
          users: [
            {
              type: 'email',
              email: 'bob@example.com',
              name: 'Bob',
              role: 'MEMBER',
            },
          ],
        },
      })
    })
  })

  it('submits identifiers with surrounding whitespace instead of blocking on "unresolved" names', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 3, spaceId: mockSpaceId, name: 'Dave', role: 'MEMBER', status: 'INVITED' }],
    })

    render(<TestComponent spaceId={mockSpaceId} />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '  Dave@Example.com  ' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(mockInviteMembers).toHaveBeenCalledWith({
        spaceId: mockSpaceId,
        inviteUsersDto: {
          users: [
            {
              type: 'email',
              email: 'dave@example.com',
              name: 'Dave',
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
        { userId: 1, spaceId: mockSpaceId, name: 'wallet', role: 'MEMBER', status: 'INVITED' },
        { userId: 2, spaceId: mockSpaceId, name: 'email', role: 'MEMBER', status: 'INVITED' },
      ],
    })

    render(<TestComponent spaceId={mockSpaceId} />)

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
        spaceId: mockSpaceId,
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
              name: 'Carol',
              role: 'MEMBER',
            },
          ],
        },
      })
      expect(trackEvent).toHaveBeenCalledTimes(2)
    })
  })
})

describe('useInviteForm isSubmitting state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps isSubmitting true after a successful invite so the spinner persists through navigation', async () => {
    mockInviteMembers.mockResolvedValue({
      data: [{ userId: 7, spaceId: mockSpaceId, name: 'Alice', role: 'MEMBER', status: 'INVITED' }],
    })

    render(<TestComponent spaceId={mockSpaceId} />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled())
    expect(screen.getByTestId('is-submitting')).toHaveTextContent('true')
  })

  it('resets isSubmitting when the mutation returns an error', async () => {
    mockInviteMembers.mockResolvedValue({ error: { status: 500, data: 'boom' } })

    render(<TestComponent spaceId={mockSpaceId} />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => expect(screen.getByTestId('is-submitting')).toHaveTextContent('false'))
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('resets isSubmitting when the mutation throws, so the button never stays stuck', async () => {
    mockInviteMembers.mockRejectedValue(new Error('network down'))

    render(<TestComponent spaceId={mockSpaceId} />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => expect(screen.getByTestId('is-submitting')).toHaveTextContent('false'))
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})
