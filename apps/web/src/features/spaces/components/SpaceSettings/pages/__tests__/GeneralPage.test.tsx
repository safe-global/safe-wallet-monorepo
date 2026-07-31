import { render, screen } from '@/tests/test-utils'
import GeneralPage from '../GeneralPage'

const mockUseSpaceMembersByStatus = jest.fn()

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => 'space-uuid',
  useSpaceMembersByStatus: () => mockUseSpaceMembersByStatus(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => ({ currentData: undefined }),
}))

jest.mock('../../sections/IdentitySection', () => ({
  __esModule: true,
  default: () => <div data-testid="identity-section" />,
}))

jest.mock('../../sections/AppearanceSection', () => ({
  __esModule: true,
  default: () => <div data-testid="appearance-section" />,
}))

jest.mock('../../sections/DangerZoneSection', () => ({
  __esModule: true,
  default: () => <div data-testid="danger-zone-section" />,
}))

jest.mock('@/features/oidc-auth', () => ({
  WorkspaceTwoFactorSection: ({ members, spaceId }: { members: { id: number }[]; spaceId?: string }) => (
    <div data-testid="workspace-2fa-section">{`${members.length}:${spaceId}`}</div>
  ),
}))

describe('GeneralPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSpaceMembersByStatus.mockReturnValue({ activeMembers: [{ id: 1 }, { id: 2 }], invitedMembers: [] })
  })

  it('renders the workspace 2FA section with the active members of the current space', () => {
    render(<GeneralPage />)

    expect(screen.getByTestId('workspace-2fa-section')).toHaveTextContent('2:space-uuid')
  })

  it('keeps the 2FA section between identity and appearance', () => {
    render(<GeneralPage />)

    const sections = screen.getByTestId('settings-general-page').children

    expect(Array.from(sections).map((section) => section.getAttribute('data-testid'))).toEqual([
      'identity-section',
      'workspace-2fa-section',
      'appearance-section',
      'danger-zone-section',
    ])
  })
})
