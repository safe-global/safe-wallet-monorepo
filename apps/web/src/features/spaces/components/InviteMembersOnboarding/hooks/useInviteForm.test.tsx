import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
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
  const { onSubmit, register, fields } = useInviteForm(spaceId, mockOnSuccess)
  return (
    <form onSubmit={onSubmit}>
      {fields.map((field, index) => (
        <input key={field.id} data-testid={`address-${index}`} {...register(`members.${index}.address`)} />
      ))}
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
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: '11111111-1111-1111-1111-111111111111' },
        { workspace_id: '11111111-1111-1111-1111-111111111111', user_id: 7, role: 'member', batch_size: 1 },
      )
    })
  })
})
