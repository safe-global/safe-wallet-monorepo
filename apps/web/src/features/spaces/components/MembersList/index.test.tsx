import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import MembersList from './index'

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
          memberBuilder()
            .with({
              id: 2,
              role: 'ADMIN',
              status: 'DECLINED',
              name: 'Bob',
              user: memberUserBuilder().with({ id: 12, status: 'PENDING', email: 'bob@example.com' }).build(),
            })
            .build(),
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
          memberBuilder()
            .with({
              user: memberUserBuilder().with({ email: 'alice@example.com' }).build(),
            })
            .build(),
        ]}
      />,
    )

    expect(screen.queryByText('Email')).not.toBeInTheDocument()
    expect(screen.queryByText('alice@example.com')).not.toBeInTheDocument()
  })

  it('leaves empty email cells blank when email column is enabled', () => {
    render(
      <MembersList
        showEmail
        members={[
          memberBuilder()
            .with({
              name: 'Alice',
              user: memberUserBuilder().with({ email: 'alice@example.com' }).build(),
            })
            .build(),
          memberBuilder()
            .with({
              id: 2,
              role: 'ADMIN',
              status: 'INVITED',
              name: 'Bob',
              user: memberUserBuilder().with({ id: 12, status: 'PENDING' }).build(),
            })
            .build(),
        ]}
      />,
    )

    const emailCells = screen.getAllByTestId('table-cell-email')

    expect(emailCells).toHaveLength(2)
    expect(within(emailCells[0]!).getByText('alice@example.com')).toBeInTheDocument()
    expect(within(emailCells[1]!).queryByText(/@/)).not.toBeInTheDocument()
  })

  it('wires up noWrap and a hover tooltip for long invite emails', async () => {
    const longEmail = `${'a'.repeat(64)}@${'b'.repeat(186)}.com`

    const { user } = renderWithUserEvent(
      <MembersList
        showEmail
        members={[
          memberBuilder()
            .with({
              name: 'Alice',
              user: memberUserBuilder().with({ email: longEmail }).build(),
            })
            .build(),
        ]}
      />,
    )

    const emailNode = screen.getByText(longEmail)
    expect(emailNode).toHaveClass('MuiTypography-noWrap')

    await user.hover(emailNode)
    expect(await screen.findByRole('tooltip', { name: longEmail })).toBeInTheDocument()
  })
})
