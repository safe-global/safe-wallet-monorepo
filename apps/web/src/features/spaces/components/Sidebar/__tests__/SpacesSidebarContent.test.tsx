import { render, screen } from '@testing-library/react'
import { SpacesSidebarContent } from '../variants/SpacesSidebarContent'
import type { SpaceItem } from '../types'

// Mock hooks
const mockUseCurrentSpaceId = jest.fn()
const mockUseIsActiveMember = jest.fn()
const mockUseResolvedSidebarNav = jest.fn()

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/features/spaces/hooks/useSpaceMembers', () => ({
  useIsActiceMember: jest.fn((spaceId) => mockUseIsActiveMember(spaceId)),
}))

jest.mock('../hooks/useResolvedSidebarNav', () => ({
  useResolvedSidebarNav: jest.fn((main, setup, options) => mockUseResolvedSidebarNav(main, setup, options)),
}))

// Mock config
jest.mock('../config', () => ({
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

// Mock SpacesSidebarVariant
jest.mock('../variants/SpacesSidebarVariant', () => ({
  SpacesSidebarVariant: ({ mainNavItems, setupGroup }: any) => (
    <div>
      <div>Main items: {mainNavItems.length}</div>
      <div>Setup items: {setupGroup.items.length}</div>
    </div>
  ),
}))

describe('SpacesSidebarContent', () => {
  const mockSpace: SpaceItem = {
    id: 1,
    name: 'Test Space',
  }

  const mockSpaces: SpaceItem[] = [
    { id: 1, name: 'Space 1' },
    { id: 2, name: 'Space 2' },
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
  })

  it('renders SpacesSidebarVariant with resolved navigation', () => {
    render(
      <SpacesSidebarContent spaceName="Test Space" spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />,
    )

    expect(screen.getByText(/Main items:/)).toBeInTheDocument()
    expect(screen.getByText(/Setup items:/)).toBeInTheDocument()
  })

  it('disables items requiring active membership when user is not active member', () => {
    mockUseIsActiveMember.mockReturnValue(false)

    render(
      <SpacesSidebarContent spaceName="Test Space" spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />,
    )

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0]
    expect(options.isItemDisabled({ activeMemberOnly: true })).toBe(true)
  })

  it('enables items requiring active membership when user is active member', () => {
    mockUseIsActiveMember.mockReturnValue(true)

    render(
      <SpacesSidebarContent spaceName="Test Space" spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />,
    )

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0]
    expect(options.isItemDisabled({ activeMemberOnly: true })).toBe(false)
  })

  it('generates links with current space ID', () => {
    mockUseCurrentSpaceId.mockReturnValue('123')

    render(
      <SpacesSidebarContent spaceName="Test Space" spaceInitial="T" selectedSpace={mockSpace} spaces={mockSpaces} />,
    )

    const [, , options] = mockUseResolvedSidebarNav.mock.calls[0]
    const link = options.getLink({ href: '/spaces/members' })

    expect(link).toEqual({
      pathname: '/spaces/members',
      query: { spaceId: '123' },
    })
  })

  it('handles undefined selectedSpace', () => {
    mockUseIsActiveMember.mockReturnValue(false)

    render(
      <SpacesSidebarContent spaceName="Test Space" spaceInitial="T" selectedSpace={undefined} spaces={mockSpaces} />,
    )

    expect(screen.getByText(/Main items:/)).toBeInTheDocument()
  })
})
