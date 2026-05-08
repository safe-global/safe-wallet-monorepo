import { fireEvent, render, screen } from '@testing-library/react'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const mockUseIsAdmin = jest.fn()
const mockUseIsInvited = jest.fn()
const mockUseSpaceMembersByStatus = jest.fn()
const mockUseMembersSearch = jest.fn()

const MEMBER_CREATED_AT = '2026-04-24T00:00:00.000Z'

const memberDto = (overrides: Partial<MemberDto>): MemberDto => ({
  id: 1,
  role: 'MEMBER',
  status: 'ACTIVE',
  name: 'Alice',
  alias: null,
  invitedBy: null,
  createdAt: MEMBER_CREATED_AT,
  updatedAt: MEMBER_CREATED_AT,
  user: { id: 11, status: 'ACTIVE' },
  ...overrides,
})

jest.mock('@/features/spaces', () => ({
  useIsAdmin: () => mockUseIsAdmin(),
  useIsInvited: () => mockUseIsInvited(),
  useSpaceMembersByStatus: () => mockUseSpaceMembersByStatus(),
  useMembersSearch: (members: unknown) => mockUseMembersSearch(members),
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

jest.mock('../SearchInput', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (q: string) => void }) => (
    <input data-testid="search-input" onChange={(event) => onSearch(event.target.value)} />
  ),
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_LABELS: { members_page: 'members_page' },
  SPACE_EVENTS: { ADD_MEMBER_MODAL: {}, SEARCH_MEMBERS: {} },
}))

import SpaceMembers from './index'

describe('SpaceMembers pending invitations visibility', () => {
  const activeMember = memberDto({ id: 1, name: 'Active Alice', status: 'ACTIVE' })
  const invitedMember = memberDto({ id: 2, name: 'Pending Bob', status: 'INVITED' })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsInvited.mockReturnValue(false)
    mockUseSpaceMembersByStatus.mockReturnValue({
      activeMembers: [activeMember],
      invitedMembers: [invitedMember],
    })
    mockUseMembersSearch.mockImplementation((members: MemberDto[]) => members)
  })

  it('shows the pending invitations section to admins', () => {
    mockUseIsAdmin.mockReturnValue(true)

    render(<SpaceMembers />)

    expect(screen.getByText(/Pending invitations \(1\)/)).toBeInTheDocument()
    expect(screen.getByText('Pending Bob')).toBeInTheDocument()
  })

  it('hides the pending invitations section from non-admins', () => {
    mockUseIsAdmin.mockReturnValue(false)

    render(<SpaceMembers />)

    expect(screen.queryByText(/Pending invitations/)).not.toBeInTheDocument()
    expect(screen.queryByText('Pending Bob')).not.toBeInTheDocument()
    expect(screen.getByText('Active Alice')).toBeInTheDocument()
  })

  it('shows the empty-search state for non-admins when only invitations would match', () => {
    mockUseIsAdmin.mockReturnValue(false)
    mockUseMembersSearch.mockImplementation((members: MemberDto[]) =>
      members.filter((member) => member.status === 'INVITED'),
    )

    render(<SpaceMembers />)

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'Bob' } })

    expect(screen.getByText('Found 0 results')).toBeInTheDocument()
  })
})
