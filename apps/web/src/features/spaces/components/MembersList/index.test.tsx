import { render, screen, within } from '@/tests/test-utils'
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

jest.mock('./RenewInviteButton', () => ({
  __esModule: true,
  default: () => <button>Renew invitation</button>,
}))

jest.mock('./MemberRowActionsMenu', () => ({
  __esModule: true,
  default: () => <button>Member actions</button>,
}))

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/features/spaces', () => ({
  useIsAdmin: () => true,
  getMemberDisplayName: (member: { alias?: string | null; name: string }) => member.alias || member.name,
  isAdmin: (member: { role: string }) => member.role === 'ADMIN',
  isActiveAdmin: (member: { role: string; status: string }) => member.role === 'ADMIN' && member.status === 'ACTIVE',
  isInviteExpired: (member: { status: string; inviteExpiresAt?: string | null }) =>
    member.status === 'INVITED' &&
    member.inviteExpiresAt != null &&
    new Date(member.inviteExpiresAt).getTime() <= Date.now(),
  MemberStatus: {
    INVITED: 'INVITED',
    ACTIVE: 'ACTIVE',
    DECLINED: 'DECLINED',
  },
  useAdminCount: () => 2,
}))

describe('MembersList', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false)
  })

  it('renders member email and leaves empty email cells blank', () => {
    render(
      <MembersList
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

    expect(screen.getByText('Email')).toBeInTheDocument()

    const emailCells = screen.getAllByTestId('table-cell-email')

    expect(emailCells).toHaveLength(2)
    expect(within(emailCells[0]!).getByText('alice@example.com')).toBeInTheDocument()
    expect(within(emailCells[1]!).queryByText(/@/)).not.toBeInTheDocument()
  })

  it('truncates long member emails inside a tooltip trigger', () => {
    const longEmail = `${'a'.repeat(64)}@${'b'.repeat(186)}.com`

    render(
      <MembersList
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
    expect(emailNode).toHaveClass('truncate')
  })

  it('shows an Expired chip for a pending invite past its expiry', () => {
    render(
      <MembersList
        members={[
          memberBuilder()
            .with({ status: 'INVITED', name: 'Expired Bob', inviteExpiresAt: '2020-01-01T00:00:00.000Z' })
            .build(),
        ]}
      />,
    )

    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('does not show an Expired chip for active members or unexpired invites', () => {
    render(
      <MembersList
        members={[
          memberBuilder().with({ status: 'ACTIVE', name: 'Alice' }).build(),
          memberBuilder()
            .with({ id: 2, status: 'INVITED', name: 'Future Bob', inviteExpiresAt: '2999-01-01T00:00:00.000Z' })
            .build(),
        ]}
      />,
    )

    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
  })

  it('renders the Renew button for pending email invites and for expired invites without an email', () => {
    render(
      <MembersList
        members={[
          // Active member — never renewable
          memberBuilder().with({ id: 1, status: 'ACTIVE', name: 'Alice' }).build(),
          // Pending email invite — renewable
          memberBuilder()
            .with({
              id: 2,
              status: 'INVITED',
              name: 'Bob',
              user: memberUserBuilder().with({ email: 'bob@x.io' }).build(),
            })
            .build(),
          // Expired invite without email — renewable
          memberBuilder()
            .with({ id: 3, status: 'INVITED', name: 'Carol', inviteExpiresAt: '2020-01-01T00:00:00.000Z' })
            .build(),
          // Declined — never renewable
          memberBuilder().with({ id: 4, status: 'DECLINED', name: 'Dave' }).build(),
        ]}
      />,
    )

    expect(screen.getAllByRole('button', { name: 'Renew invitation' })).toHaveLength(2)
  })

  it('does not render the Renew button for an unexpired invite without an email', () => {
    render(
      <MembersList
        members={[
          memberBuilder()
            .with({ id: 1, status: 'INVITED', name: 'Bob', inviteExpiresAt: '2999-01-01T00:00:00.000Z' })
            .build(),
        ]}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Renew invitation' })).not.toBeInTheDocument()
  })

  it('collapses row actions into a kebab menu on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(
      <MembersList
        members={[
          memberBuilder()
            .with({
              id: 2,
              status: 'INVITED',
              name: 'Bob',
              user: memberUserBuilder().with({ email: 'bob@x.io' }).build(),
            })
            .build(),
        ]}
      />,
    )

    // The kebab replaces the inline edit / renew / remove cluster
    expect(screen.getByRole('button', { name: 'Member actions' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Renew invitation' })).not.toBeInTheDocument()
  })

  it('surfaces the email under the member name on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)

    render(
      <MembersList
        members={[
          memberBuilder()
            .with({ name: 'Alice', user: memberUserBuilder().with({ email: 'alice@example.com' }).build() })
            .build(),
        ]}
      />,
    )

    const nameCell = screen.getByTestId('table-cell-name')
    expect(within(nameCell).getByText('alice@example.com')).toBeInTheDocument()
  })
})
