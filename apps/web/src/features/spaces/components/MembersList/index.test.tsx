import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import MembersList from './index'

const MEMBER_CREATED_AT = '2026-04-24T00:00:00.000Z'

const memberDto = ({
  user,
  ...overrides
}: Omit<Partial<MemberDto>, 'user'> & {
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
    email: null,
    ...user,
  },
  ...overrides,
})

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
  })

  it('shows the email column for invitation rows when enabled', () => {
    render(
      <MembersList
        showEmail
        members={[
          memberDto({
            id: 2,
            role: 'ADMIN',
            status: 'DECLINED',
            name: 'Bob',
            user: {
              id: 12,
              status: 'PENDING',
              email: 'bob@example.com',
            },
          }),
        ]}
      />,
    )

    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('does not show the email column by default', () => {
    render(
      <MembersList
        members={[
          memberDto({
            user: {
              email: 'alice@example.com',
            },
          }),
        ]}
      />,
    )

    expect(screen.queryByText('Email')).not.toBeInTheDocument()
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument()
  })
})
