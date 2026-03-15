import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useInviteForm from './useInviteForm'

const mockDispatch = jest.fn()
const mockInviteMembers = jest.fn()
const mockOnSuccess = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    ADD_MEMBER: { action: 'Submit add member', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
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

  it('tracks ADD_MEMBER with spaceId for both GA and Mixpanel exactly once on submit', async () => {
    mockInviteMembers.mockResolvedValue({ data: {} })

    render(<TestComponent spaceId="42" />)

    fireEvent.change(screen.getByTestId('address-0'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })
    fireEvent.click(screen.getByTestId('submit'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.ADD_MEMBER, label: '42' }, { spaceId: '42' })
    })
  })
})
