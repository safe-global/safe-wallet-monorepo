import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { formatTimeInWords, formatWithSchema } from '@safe-global/utils/utils/date'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import MembersList from './index'

const formatDate = (iso: string) => formatWithSchema(new Date(iso).getTime(), 'MMM d, yyyy')

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

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/features/spaces', () => ({
  useIsAdmin: () => true,
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

  it('wires up noWrap and a hover tooltip for long member emails', async () => {
    const longEmail = `${'a'.repeat(64)}@${'b'.repeat(186)}.com`

    const { user } = renderWithUserEvent(
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
    expect(emailNode).toHaveClass('MuiTypography-noWrap')

    await user.hover(emailNode)
    expect(await screen.findByRole('tooltip', { name: longEmail })).toBeInTheDocument()
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

  it('shows a single "Member since" join-date column for the active variant', () => {
    const createdAt = '2026-04-22T12:00:00.000Z'
    render(<MembersList variant="active" members={[memberBuilder().with({ name: 'Alice', createdAt }).build()]} />)

    expect(screen.getByText('Member since')).toBeInTheDocument()
    expect(screen.queryByText('Invited on')).not.toBeInTheDocument()
    expect(screen.queryByText('Expires')).not.toBeInTheDocument()
    expect(within(screen.getByTestId('table-cell-memberSince')).getByText(formatDate(createdAt))).toBeInTheDocument()
  })

  it('shows both an "Invited on" date and a relative "Expires" column for the pending variant', () => {
    const createdAt = '2026-04-22T12:00:00.000Z'
    const inviteExpiresAt = '2027-01-01T12:00:00.000Z'
    render(
      <MembersList
        variant="pending"
        members={[memberBuilder().with({ status: 'INVITED', name: 'Bob', createdAt, inviteExpiresAt }).build()]}
      />,
    )

    expect(screen.getByText('Invited on')).toBeInTheDocument()
    expect(screen.getByText('Expires')).toBeInTheDocument()
    expect(screen.queryByText('Member since')).not.toBeInTheDocument()

    // "Invited on" is the absolute creation date; "Expires" is relative time-to-go.
    expect(within(screen.getByTestId('table-cell-invitedOn')).getByText(formatDate(createdAt))).toBeInTheDocument()
    expect(
      within(screen.getByTestId('table-cell-expires')).getByText(
        formatTimeInWords(new Date(inviteExpiresAt).getTime()),
      ),
    ).toBeInTheDocument()
  })

  it('renders a dash in the Expires column when a pending invite has no expiry', () => {
    render(
      <MembersList
        variant="pending"
        members={[
          memberBuilder()
            .with({
              status: 'INVITED',
              name: 'Bob',
              inviteExpiresAt: null,
              user: memberUserBuilder().with({ email: 'bob@x.io' }).build(),
            })
            .build(),
        ]}
      />,
    )

    expect(within(screen.getByTestId('table-cell-expires')).getByText('–')).toBeInTheDocument()
  })
})
