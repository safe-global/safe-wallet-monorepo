import { fireEvent, render, screen } from '@testing-library/react'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { memberBuilder } from '@/tests/builders/member'

const mockUseIsAdmin = jest.fn()
const mockUseIsInvited = jest.fn()
const mockUseSpaceMembersByStatus = jest.fn()

jest.mock('@/features/spaces', () => ({
  useIsAdmin: () => mockUseIsAdmin(),
  useIsInvited: () => mockUseIsInvited(),
  useSpaceMembersByStatus: () => mockUseSpaceMembersByStatus(),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: jest.fn(() => false),
}))

jest.mock('../MembersList', () => ({
  __esModule: true,
  default: ({ members }: { members: MemberDto[] }) => (
    <ul data-testid="members-list">
      {members.map((member) => (
        <li key={member.id}>{member.name}</li>
      ))}
    </ul>
  ),
}))

jest.mock('../AddMemberModal', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../InviteBanner/PreviewInvite', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_LABELS: { members_page: 'members_page' },
  SPACE_EVENTS: { ADD_MEMBER_MODAL: {} },
}))

import SpaceMembers from './index'

describe('SpaceMembers', () => {
  const activeMember = memberBuilder().with({ id: 1, name: 'Active Alice', status: 'ACTIVE' }).build()
  const invitedMember = memberBuilder().with({ id: 2, name: 'Pending Bob', status: 'INVITED' }).build()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsInvited.mockReturnValue(false)
    mockUseIsAdmin.mockReturnValue(true)
    mockUseSpaceMembersByStatus.mockReturnValue({
      activeMembers: [activeMember],
      invitedMembers: [invitedMember],
    })
  })

  it('renders the members and pending tabs with counts', () => {
    render(<SpaceMembers />)

    expect(screen.getByRole('tab', { name: /Members \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Pending \(1\)/ })).toBeInTheDocument()
  })

  it('shows active members in the default tab', () => {
    render(<SpaceMembers />)

    expect(screen.getByText('Active Alice')).toBeInTheDocument()
  })

  it('shows invited members after switching to the pending tab', () => {
    render(<SpaceMembers />)

    fireEvent.click(screen.getByRole('tab', { name: /Pending \(1\)/ }))

    expect(screen.getByText('Pending Bob')).toBeInTheDocument()
  })

  it('shows an empty state in the pending tab when there are no invitations', () => {
    mockUseSpaceMembersByStatus.mockReturnValue({
      activeMembers: [activeMember],
      invitedMembers: [],
    })

    render(<SpaceMembers />)

    fireEvent.click(screen.getByRole('tab', { name: /Pending \(0\)/ }))

    expect(screen.getByText('No pending members.')).toBeInTheDocument()
  })

  it('shows the add member button to admins', () => {
    render(<SpaceMembers />)

    expect(screen.getByTestId('add-member-button')).toBeInTheDocument()
  })

  it('hides the add member button from non-admins', () => {
    mockUseIsAdmin.mockReturnValue(false)

    render(<SpaceMembers />)

    expect(screen.queryByTestId('add-member-button')).not.toBeInTheDocument()
  })
})
