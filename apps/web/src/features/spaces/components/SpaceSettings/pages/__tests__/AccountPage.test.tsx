import { render, screen, fireEvent } from '@testing-library/react'
import AccountPage from '../AccountPage'

const mockUseCurrentMemberProfile = jest.fn()

jest.mock('../../../../public/useSpaceMembers', () => ({
  get MemberRole() {
    return jest.requireActual('../../../../public/useSpaceMembers').MemberRole
  },
  get MEMBER_ALIAS_MAX_LENGTH() {
    return jest.requireActual('../../../../public/useSpaceMembers').MEMBER_ALIAS_MAX_LENGTH
  },
  get sanitizeMemberAlias() {
    return jest.requireActual('../../../../public/useSpaceMembers').sanitizeMemberAlias
  },
  get isAdmin() {
    return jest.requireActual('../../../../public/useSpaceMembers').isAdmin
  },
  get isActiveAdmin() {
    return jest.requireActual('../../../../public/useSpaceMembers').isActiveAdmin
  },
  get isInviteExpired() {
    return jest.requireActual('../../../../public/useSpaceMembers').isInviteExpired
  },
  get useSpaceMembersByStatus() {
    return jest.requireActual('../../../../public/useSpaceMembers').useSpaceMembersByStatus
  },
  get useCurrentMembership() {
    return jest.requireActual('../../../../public/useSpaceMembers').useCurrentMembership
  },
  get useIsActiveMember() {
    return jest.requireActual('../../../../public/useSpaceMembers').useIsActiveMember
  },
  get useIsAdmin() {
    return jest.requireActual('../../../../public/useSpaceMembers').useIsAdmin
  },
  get useIsInvited() {
    return jest.requireActual('../../../../public/useSpaceMembers').useIsInvited
  },
  useCurrentMemberProfile: () => mockUseCurrentMemberProfile(),
  MemberStatus: { INVITED: 'INVITED', ACTIVE: 'ACTIVE', DECLINED: 'DECLINED' },
  getMemberDisplayName: (member: { alias?: string | null; name: string }) => member.alias || member.name,
}))

jest.mock('@/features/oidc-auth/public/SwitchAuthenticatorSection', () => ({
  __esModule: true,
  default: () => <div data-testid="switch-authenticator-section" />,
}))
jest.mock('@/features/oidc-auth/public/WalletTwoFactorSection', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-2fa-section" />,
}))

jest.mock('@/hooks/useLogout', () => ({
  __esModule: true,
  default: () => ({ logout: jest.fn() }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('../../../MembersList/EditMemberDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-member-dialog" />,
}))

const activeMembership = {
  id: 1,
  name: 'Alice',
  alias: null,
  role: 'ADMIN',
  status: 'ACTIVE',
  user: { id: 1, status: 'ACTIVE', email: null },
}

describe('AccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: activeMembership,
      signerAddress: undefined,
      email: undefined,
      isLoading: false,
    })
  })

  it('shows the display name (alias over name)', () => {
    mockUseCurrentMemberProfile.mockReturnValue({
      membership: { ...activeMembership, alias: 'Alice Admin' },
      isLoading: false,
    })

    render(<AccountPage />)

    expect(screen.getByText('Alice Admin')).toBeInTheDocument()
  })

  it('opens the edit dialog from the edit affordance', () => {
    render(<AccountPage />)

    expect(screen.queryByTestId('edit-member-dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('settings-edit-name'))

    expect(screen.getByTestId('edit-member-dialog')).toBeInTheDocument()
  })

  it('does not render the edit affordance when not signed in', () => {
    mockUseCurrentMemberProfile.mockReturnValue({ membership: undefined, isLoading: false })

    render(<AccountPage />)

    expect(screen.queryByTestId('settings-edit-name')).not.toBeInTheDocument()
  })
})
