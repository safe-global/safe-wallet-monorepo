import { render, screen } from '@testing-library/react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SpacesSidebarContent } from '../SpacesSidebarContent'
import type { SpaceItem, ResolvedSidebarItem, ResolvedSidebarGroup } from '../../../types'

const mockUseCurrentSpaceId = jest.fn()
const mockUseIsActiveMember = jest.fn()
const mockUseResolvedSidebarNav = jest.fn()
const mockUseHasFeature = jest.fn()

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  useIsActiveMember: jest.fn((spaceId) => mockUseIsActiveMember(spaceId)),
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn((feature) => mockUseHasFeature(feature)),
}))

jest.mock('../../../hooks/useResolvedSidebarNav', () => ({
  useResolvedSidebarNav: jest.fn((main, setup, options) => mockUseResolvedSidebarNav(main, setup, options)),
}))

jest.mock('../../../config', () => ({
  spacesMainNavigation: [
    {
      icon: () => <div>Home</div>,
      label: 'Home',
      href: '/spaces',
    },
    {
      icon: () => <div>Transactions</div>,
      label: 'Transactions',
      href: '/spaces/transactions',
    },
    {
      icon: () => <div>Activity</div>,
      label: 'Activity',
      href: '/spaces/activity',
      activeMemberOnly: true,
    },
  ],
  spacesSetupGroup: {
    label: 'Setup',
    items: [
      {
        icon: () => <div>Team</div>,
        label: 'Team',
        href: '/spaces/members',
      },
      {
        icon: () => <div>Security</div>,
        label: 'Security',
        href: '/spaces/security',
        activeMemberOnly: true,
      },
    ],
  },
}))

jest.mock('../../SpacesSidebarVariant', () => ({
  SpacesSidebarVariant: ({
    mainNavItems,
    setupGroup,
  }: {
    mainNavItems: ResolvedSidebarItem[]
    setupGroup: ResolvedSidebarGroup
  }) => (
    <div>
      <div>Main items: {mainNavItems.length}</div>
      <div>Setup items: {setupGroup.items.length}</div>
    </div>
  ),
}))

describe('SpacesSidebarContent', () => {
  const mockSpace: SpaceItem = {
    uuid: 'uuid-1',
    name: 'Test Space',
    safeCount: 0,
  }

  const mockSpaces: SpaceItem[] = [
    { uuid: 'uuid-1', name: 'Space 1', safeCount: 0 },
    { uuid: 'uuid-2', name: 'Space 2', safeCount: 0 },
  ]

  const mockResolvedNavItems = {
    mainNavItems: [
      {
        icon: () => <div>Home</div>,
        label: 'Home',
        href: '/spaces',
        badge: 0,
        isActive: true,
        disabled: false,
        link: { pathname: '/spaces', query: { spaceId: '1' } },
      },
    ],
    setupGroup: {
      label: 'Setup',
      items: [
        {
          icon: () => <div>Team</div>,
          label: 'Team',
          href: '/spaces/members',
          badge: 0,
          isActive: false,
          disabled: false,
          link: { pathname: '/spaces/members', query: { spaceId: '1' } },
        },
      ],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentSpaceId.mockReturnValue('1')
    mockUseIsActiveMember.mockReturnValue(true)
    mockUseResolvedSidebarNav.mockReturnValue(mockResolvedNavItems)
    mockUseHasFeature.mockReturnValue(true)
  })

  it('renders SpacesSidebarVariant with resolved navigation', () => {
    render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

    expect(screen.getByText(/Main items:/)).toBeInTheDocument()
    expect(screen.getByText(/Setup items:/)).toBeInTheDocument()
  })

  it('disables items requiring active membership when user is not active member', () => {
    mockUseIsActiveMember.mockReturnValue(false)

    render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0]
    expect(options.isItemDisabled({ activeMemberOnly: true })).toBe(true)
  })

  it('enables items requiring active membership when user is active member', () => {
    mockUseIsActiveMember.mockReturnValue(true)

    render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0]
    expect(options.isItemDisabled({ activeMemberOnly: true })).toBe(false)
  })

  it('generates links with current space ID', () => {
    mockUseCurrentSpaceId.mockReturnValue('123')

    render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0]
    const link = options.getLink({ href: '/spaces/members' })

    expect(link).toEqual({
      pathname: '/spaces/members',
      query: { spaceId: '123' },
    })
  })

  it('handles undefined selectedSpace', () => {
    mockUseIsActiveMember.mockReturnValue(false)

    render(<SpacesSidebarContent spaceInitial="T" selectedSpace={undefined} spaces={mockSpaces} />)

    expect(screen.getByText(/Main items:/)).toBeInTheDocument()
  })

  describe('SECURITY_HUB feature flag', () => {
    it('hides the Security entry when the flag is explicitly off', () => {
      mockUseHasFeature.mockReturnValue(false)

      render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

      const [, setupGroup] = mockUseResolvedSidebarNav.mock.calls[0]
      // The mocked config has Team + Security; only Team should remain.
      expect(setupGroup.items.map((i: { href: string }) => i.href)).toEqual(['/spaces/members'])
    })

    it('keeps the Security entry while the flag is undefined (chain config still loading)', () => {
      mockUseHasFeature.mockReturnValue(undefined)

      render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

      const [, setupGroup] = mockUseResolvedSidebarNav.mock.calls[0]
      expect(setupGroup.items).toHaveLength(2)
    })

    it('keeps the Security entry when the flag is enabled', () => {
      mockUseHasFeature.mockReturnValue(true)

      render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

      const [, setupGroup] = mockUseResolvedSidebarNav.mock.calls[0]
      expect(setupGroup.items).toHaveLength(2)
    })
  })

  describe('SPACE_AUDIT_LOG feature flag', () => {
    it('hides the Activity entry when the flag is explicitly off', () => {
      mockUseHasFeature.mockImplementation((feature) => feature !== FEATURES.SPACE_AUDIT_LOG)

      render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

      const [mainNav] = mockUseResolvedSidebarNav.mock.calls[0]
      // The mocked config has Home + Transactions + Activity; Activity should be dropped.
      expect(mainNav.map((i: { href: string }) => i.href)).toEqual(['/spaces', '/spaces/transactions'])
    })

    it('keeps the Activity entry while the flag is undefined (chain config still loading)', () => {
      mockUseHasFeature.mockImplementation((feature) => (feature === FEATURES.SPACE_AUDIT_LOG ? undefined : true))

      render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

      const [mainNav] = mockUseResolvedSidebarNav.mock.calls[0]
      expect(mainNav).toHaveLength(3)
    })

    it('keeps the Activity entry when the flag is enabled', () => {
      mockUseHasFeature.mockReturnValue(true)

      render(<SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />)

      const [mainNav] = mockUseResolvedSidebarNav.mock.calls[0]
      expect(mainNav).toHaveLength(3)
    })
  })

  it('is unaffected by geoblocking — nav items remain visible when user is blocked', () => {
    render(
      <GeoblockingContext.Provider value={true}>
        <SpacesSidebarContent spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />
      </GeoblockingContext.Provider>,
    )

    const [mainNav, setupGroup] = mockUseResolvedSidebarNav.mock.calls[0]
    expect(mainNav).toHaveLength(3)
    expect(setupGroup.items).toHaveLength(2)
  })
})
