import { render, screen, fireEvent } from '@testing-library/react'
import AccountPage from '../AccountPage'

const mockUseCurrentMemberProfile = jest.fn()

jest.mock('@/features/spaces', () => ({
  useCurrentMemberProfile: () => mockUseCurrentMemberProfile(),
  MemberStatus: { INVITED: 'INVITED', ACTIVE: 'ACTIVE', DECLINED: 'DECLINED' },
  getMemberDisplayName: (member: { alias?: string | null; name: string }) => member.alias || member.name,
}))

jest.mock('@/features/oidc-auth', () => ({
  SwitchAuthenticatorSection: () => <div data-testid="switch-authenticator-section" />,
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
