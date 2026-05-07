import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { showNotification } from '@/store/notificationsSlice'
import MembersList from './index'

const mockResendInvite = jest.fn()
const mockDispatch = jest.fn()
const MEMBER_CREATED_AT = '2026-04-24T00:00:00.000Z'

const memberDto = ({
  user,
  ...overrides
}: Partial<MemberDto> & {
  user?: Partial<MemberDto['user']>
}): MemberDto => ({
  id: 1,
  role: 'MEMBER',
  status: 'ACTIVE',
  name: 'Alice',
  alias: null,
  invitedBy: null,
  createdAt: MEMBER_CREATED_AT,
  updatedAt: MEMBER_CREATED_AT,
  user: {
    id: 11,
    status: 'ACTIVE',
    ...user,
  },
  ...overrides,
})

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersResendInviteV1Mutation: () => [mockResendInvite, { isLoading: false }],
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: Parameters<typeof showNotification>[0]) => ({ type: 'notifications/show', payload }),
}))

jest.mock('./MemberName', () => ({
  __esModule: true,
  default: ({ member }: { member: { name: string } }) => <div>{member.name}</div>,
}))

jest.mock('./RemoveMemberDialog', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('./EditMemberDialog', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => 1,
  useIsAdmin: () => true,
  isAdmin: (member: { role: string }) => member.role === 'ADMIN',
  isActiveAdmin: (member: { role: string; status: string }) => member.role === 'ADMIN' && member.status === 'ACTIVE',
  MemberStatus: {
    INVITED: 'INVITED',
    DECLINED: 'DECLINED',
  },
  useAdminCount: () => 2,
}))

describe('MembersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResendInvite.mockResolvedValue({})
  })

  it('resends invitations from the declined invitation row', async () => {
    const user = userEvent.setup()

    render(
      <MembersList
        members={[
          memberDto({
            id: 2,
            role: 'ADMIN',
            status: 'DECLINED',
            name: 'Bob',
            user: {
              id: 12,
              status: 'PENDING',
            },
          }),
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Resend' }))

    expect(mockResendInvite).toHaveBeenCalledWith({ spaceId: 1, userId: 12 })
  })
})
