import { render, screen } from '@/tests/test-utils'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import WorkspaceTwoFactorSection from '../index'

const mockUseHasFeature = jest.fn(() => true)

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

const oidcMember = (id: number) =>
  memberBuilder()
    .with({
      id,
      status: 'ACTIVE',
      user: memberUserBuilder()
        .with({ id, email: `user${id}@example.com` })
        .build(),
    })
    .build()

const walletMember = (id: number) =>
  memberBuilder()
    .with({ id, status: 'ACTIVE', user: memberUserBuilder().with({ id, email: null }).build() })
    .build()

describe('WorkspaceTwoFactorSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
  })

  it('renders nothing when the switch-authenticator feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = render(<WorkspaceTwoFactorSection members={[oidcMember(1)]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('states that 2FA is required for everyone', () => {
    render(<WorkspaceTwoFactorSection members={[oidcMember(1)]} />)

    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument()
    expect(screen.getByText('Required for everyone')).toBeInTheDocument()
  })

  it('counts wallet members as not covered', () => {
    render(<WorkspaceTwoFactorSection members={[oidcMember(1), oidcMember(2), walletMember(3)]} />)

    expect(screen.getByTestId('workspace-2fa-count')).toHaveTextContent('2/3 users have 2FA enabled')
  })

  it('handles a workspace with no members', () => {
    render(<WorkspaceTwoFactorSection members={[]} />)

    expect(screen.getByTestId('workspace-2fa-count')).toHaveTextContent('0/0 users have 2FA enabled')
  })

  it('links to the team page of the current space', () => {
    render(<WorkspaceTwoFactorSection members={[oidcMember(1)]} spaceId="space-uuid" />)

    expect(screen.getByTestId('workspace-2fa-manage-members')).toHaveAttribute(
      'href',
      '/spaces/members?spaceId=space-uuid',
    )
  })

  it('offers to manage members to an admin', () => {
    render(<WorkspaceTwoFactorSection members={[oidcMember(1)]} isAdmin />)

    expect(screen.getByTestId('workspace-2fa-manage-members')).toHaveTextContent('Manage members')
  })

  it('only offers to see members to a non-admin, who cannot manage anyone', () => {
    render(<WorkspaceTwoFactorSection members={[oidcMember(1)]} isAdmin={false} />)

    expect(screen.getByTestId('workspace-2fa-manage-members')).toHaveTextContent('See members')
  })
})
