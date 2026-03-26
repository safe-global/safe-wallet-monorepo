import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddMemberModal from './index'

const mockDispatch = jest.fn()
const mockInviteMembers = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    ADD_MEMBER: { action: 'Submit add member', category: 'spaces' },
    ADD_MEMBER_MODAL: { action: 'Open add member modal', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
  MemberRole: { MEMBER: 'MEMBER', ADMIN: 'ADMIN' },
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), pathname: '/spaces/members' }),
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

jest.mock('@/hooks/useAddressBook', () => ({
  __esModule: true,
  default: () => ({}),
}))

jest.mock('./MemberInfoForm', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/common/AddressBookInput', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => {
    const { register } = (jest.requireActual('react-hook-form') as typeof ReactHookForm).useFormContext()
    return <input {...register(name, { required: true })} data-testid="member-address-input" />
  },
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: { spaces: { members: '/spaces/members' } },
}))

describe('AddMemberModal tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks ADD_MEMBER with spaceId for both GA and Mixpanel exactly once on submit', async () => {
    mockInviteMembers.mockResolvedValue({ data: { id: 1 } })

    render(<AddMemberModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('member-address-input'), {
      target: { value: '0x1234567890123456789012345678901234567890' },
    })

    const submitButton = screen.getByTestId('add-member-modal-button')
    await waitFor(() => expect(submitButton).not.toBeDisabled())
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledTimes(1)
      expect(trackEvent).toHaveBeenCalledWith({ ...SPACE_EVENTS.ADD_MEMBER, label: '42' }, { spaceId: '42' })
    })
  })
})
