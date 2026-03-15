import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import DeclineInviteDialog from './DeclineInviteDialog'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const mockDispatch = jest.fn()
const mockDeclineInvite = jest.fn()

const mockSpace = {
  id: 42,
  name: 'Test Space',
} as unknown as GetSpaceResponse

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    DECLINE_INVITE_SUBMIT: { action: 'Submit decline invitation', category: 'spaces' },
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
  useMembersDeclineInviteV1Mutation: () => [mockDeclineInvite],
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/tx/ErrorMessage', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('DeclineInviteDialog tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks DECLINE_INVITE_SUBMIT with spaceId for both GA and Mixpanel exactly once on confirm', async () => {
    mockDeclineInvite.mockResolvedValue({})

    render(<DeclineInviteDialog space={mockSpace} onClose={jest.fn()} />)

    fireEvent.click(screen.getByTestId('decline-btn'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.DECLINE_INVITE_SUBMIT, label: '42' }, { spaceId: '42' })
    })
  })
})
