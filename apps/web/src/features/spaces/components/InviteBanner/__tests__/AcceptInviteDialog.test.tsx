import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AcceptInviteDialog from '../AcceptInviteDialog'
import { spaceBuilder, spaceMemberBuilder } from '@/tests/builders/space'

const mockDispatch = jest.fn()
const mockAcceptInvite = jest.fn()

const mockSpace = spaceBuilder()
  .with({
    uuid: '11111111-1111-1111-1111-111111111111',
    members: [
      spaceMemberBuilder()
        .with({ user: { id: 1 }, name: 'Test User' })
        .build(),
    ],
  })
  .build()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_MEMBER_INVITE_ACCEPTED: { action: 'Workspace member invite accepted', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(() => true),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@/hooks/useDarkMode', () => ({ useDarkMode: () => false }))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersAcceptInviteV1Mutation: () => [mockAcceptInvite],
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ data: { id: 1 } }),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), pathname: '/spaces' }),
}))

jest.mock('@/components/common/NameInput', () => ({
  __esModule: true,
  default: ({ name, label }: { name: string; label: string }) => {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return <input aria-label={label} {...register(name, { required: true })} data-testid="name-input" />
  },
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/common/ExternalLink', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: { spaces: { index: '/spaces' }, privacy: '/privacy', welcome: { spaces: '/welcome/spaces' } },
}))

describe('AcceptInviteDialog tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks WORKSPACE_MEMBER_INVITE_ACCEPTED with workspace_id and user_id on submit', async () => {
    mockAcceptInvite.mockResolvedValue({ data: {} })

    render(<AcceptInviteDialog space={mockSpace} onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Test User' } })

    const submitButton = screen.getByTestId('confirm-accept-invite-button')
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_ACCEPTED, label: '11111111-1111-1111-1111-111111111111' },
        { workspace_id: '11111111-1111-1111-1111-111111111111', user_id: 1 },
      )
    })
  })
})
