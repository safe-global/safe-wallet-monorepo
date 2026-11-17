import { render, screen } from '@testing-library/react'
import SpaceListInvite from '../index'
import { spaceBuilder } from '@/tests/builders/space'
import { faker } from '@faker-js/faker'

const EMAIL = faker.internet.email()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: jest.fn(() => false),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    VIEW_INVITING_SPACE: { action: 'view inviting space', category: 'spaces' },
    ACCEPT_INVITE: { action: 'accept invite', category: 'spaces' },
    DECLINE_INVITE: { action: 'decline invite', category: 'spaces' },
  },
  SPACE_LABELS: { space_list_page: 'space_list_page' },
}))

jest.mock('../Inviter', () => ({
  __esModule: true,
  default: ({ invitedByName }: { invitedByName: string | undefined }) =>
    invitedByName ? <div data-testid="inviter">{invitedByName}</div> : null,
}))

jest.mock('../AcceptButton', () => ({
  __esModule: true,
  default: () => <button data-testid="accept-button">Accept</button>,
}))

jest.mock('../DeclineButton', () => ({
  __esModule: true,
  default: () => <button data-testid="decline-button">Decline</button>,
}))

jest.mock('@/components/common/InitialsAvatar', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="initials-avatar" data-name={name} />,
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('../../../public/useSpaceMembers', () => ({
  get MemberRole() {
    return jest.requireActual('../../../public/useSpaceMembers').MemberRole
  },
  get MEMBER_ALIAS_MAX_LENGTH() {
    return jest.requireActual('../../../public/useSpaceMembers').MEMBER_ALIAS_MAX_LENGTH
  },
  get getMemberDisplayName() {
    return jest.requireActual('../../../public/useSpaceMembers').getMemberDisplayName
  },
  get sanitizeMemberAlias() {
    return jest.requireActual('../../../public/useSpaceMembers').sanitizeMemberAlias
  },
  get isAdmin() {
    return jest.requireActual('../../../public/useSpaceMembers').isAdmin
  },
  get isActiveAdmin() {
    return jest.requireActual('../../../public/useSpaceMembers').isActiveAdmin
  },
  get isInviteExpired() {
    return jest.requireActual('../../../public/useSpaceMembers').isInviteExpired
  },
  get useSpaceMembersByStatus() {
    return jest.requireActual('../../../public/useSpaceMembers').useSpaceMembersByStatus
  },
  get useCurrentMembership() {
    return jest.requireActual('../../../public/useSpaceMembers').useCurrentMembership
  },
  get useCurrentMemberProfile() {
    return jest.requireActual('../../../public/useSpaceMembers').useCurrentMemberProfile
  },
  get useIsActiveMember() {
    return jest.requireActual('../../../public/useSpaceMembers').useIsActiveMember
  },
  get useIsAdmin() {
    return jest.requireActual('../../../public/useSpaceMembers').useIsAdmin
  },
  get useIsInvited() {
    return jest.requireActual('../../../public/useSpaceMembers').useIsInvited
  },
  MemberStatus: { INVITED: 'INVITED', ACTIVE: 'ACTIVE', DECLINED: 'DECLINED' },
}))

jest.mock('@safe-global/views/features/spaces/components/SpaceCard', () => ({
  SpaceSummary: () => <div data-testid="space-summary" />,
}))

describe('SpaceListInvite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the space name as the invitation target', () => {
    const space = spaceBuilder().with({ name: 'Test Space' }).build()
    render(<SpaceListInvite space={space} invitedByName={undefined} />)
    expect(screen.getByText('Test Space')).toBeInTheDocument()
  })

  it('passes the inviter name through to the Inviter component', () => {
    render(<SpaceListInvite space={spaceBuilder().build()} invitedByName={EMAIL} />)
    expect(screen.getByTestId('inviter')).toHaveTextContent(EMAIL)
  })

  it('renders no inviter element when invitedByName is undefined', () => {
    render(<SpaceListInvite space={spaceBuilder().build()} invitedByName={undefined} />)
    expect(screen.queryByTestId('inviter')).not.toBeInTheDocument()
  })

  it('does not link into the space — pending members have no access until they accept', () => {
    render(<SpaceListInvite space={spaceBuilder().build()} invitedByName={undefined} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
