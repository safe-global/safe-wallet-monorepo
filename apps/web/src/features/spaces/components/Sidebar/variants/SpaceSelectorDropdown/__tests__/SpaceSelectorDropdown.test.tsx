import { act, fireEvent, render, screen } from '@testing-library/react'
import type * as ReactModule from 'react'
import type { ReactElement, ReactNode, CSSProperties } from 'react'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { getDeterministicColor } from '@/utils/colors'
import { SPACE_SELECTOR_NAME_MAX_LENGTH, SPACES_LIMIT } from '../../../constants'
import { truncateSpaceName } from '../../../utils'
import { SpaceSelectorDropdown } from '../SpaceSelectorDropdown'

jest.mock('../../../hooks/useAddSafeToSpace', () => ({
  useAddSafeToSpace: jest.fn(() => ({ addToSpace: jest.fn().mockResolvedValue(true), loadingSpaceId: null })),
}))

let mockIsAuthenticated = true
jest.mock('@/store', () => ({
  useAppSelector: (selector: unknown) => (typeof selector === 'function' ? selector({}) : selector),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: () => mockIsAuthenticated,
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ currentData: { id: 7 } }),
}))

type SpaceSafesQueryResult = { currentData: { safes: Record<string, string[]> } | undefined }
const mockUseSpaceSafesGetV1Query: jest.Mock<SpaceSafesQueryResult, unknown[]> = jest.fn(() => ({
  currentData: undefined,
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))

const CURRENT_USER_ID = 7

const adminMembersForCurrentUser = [
  {
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
    name: '',
    invitedBy: null,
    inviteExpiresAt: null,
    user: { id: CURRENT_USER_ID },
  },
]
const memberMembersForCurrentUser = [
  {
    role: 'MEMBER' as const,
    status: 'ACTIVE' as const,
    name: '',
    invitedBy: null,
    inviteExpiresAt: null,
    user: { id: CURRENT_USER_ID },
  },
]

const mockPush = jest.fn()
let mockRouterQuery: Record<string, string> = { spaceId: '1' }
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/spaces',
    query: mockRouterQuery,
    push: mockPush,
  }),
}))

let mockSafeAddressFromUrl = ''
let mockChainId = '1'
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeQueryParam: () => {
    const safe = mockRouterQuery.safe
    return typeof safe === 'string' ? safe : ''
  },
  useSafeAddressFromUrl: () => mockSafeAddressFromUrl,
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => mockChainId,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    WORKSPACE_CREATE_STARTED: { action: 'Workspace create started' },
    OPEN_SPACE_LIST_PAGE: {},
  },
  SPACE_LABELS: {
    space_selector: 'space_selector',
  },
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenuButton: ({
    children,
    onClick,
    ...props
  }: {
    children: ReactNode
    onClick?: () => void
    [key: string]: unknown
  }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarFallback: ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
    <div data-testid="avatar-fallback" style={style}>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/ui/dropdown-menu', () => {
  const { createContext, useContext, useState, cloneElement } = jest.requireActual('react') as typeof ReactModule

  type DropdownCtx = { open: boolean; setOpen: (open: boolean) => void }
  const Ctx = createContext<DropdownCtx | null>(null)

  const DropdownMenu = ({
    children,
    open: openProp,
    onOpenChange,
  }: {
    children: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : internalOpen
    const setOpen = (nextOpen: boolean) => {
      if (!isControlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
    }

    return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
  }

  type TriggerElementProps = { onClick?: () => void; children?: ReactNode }

  const DropdownMenuTrigger = ({
    render,
    children,
  }: {
    render: ReactElement<TriggerElementProps>
    children: ReactNode
  }) => {
    const context = useContext(Ctx)
    if (!context) return null

    return cloneElement(render, {
      onClick: () => context.setOpen(!context.open),
      children,
    })
  }

  const DropdownMenuContent = ({ children, id }: { children: ReactNode; id?: string }) => {
    const context = useContext(Ctx)
    if (!context?.open) return null
    return <div id={id}>{children}</div>
  }

  const DropdownMenuItem = ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )

  const DropdownMenuSeparator = () => <hr />

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  }
})

describe('SpaceSelectorDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterQuery = { spaceId: '1' }
    mockSafeAddressFromUrl = ''
    mockChainId = '1'
    mockIsAuthenticated = true
    mockUseSpaceSafesGetV1Query.mockImplementation(() => ({ currentData: undefined }))
  })

  it('adds an accessible label to the trigger', () => {
    render(
      <SpaceSelectorDropdown selectedSpace={{ uuid: 'uuid-1', name: 'Company Space', safeCount: 0 }} spaces={[]} />,
    )

    expect(screen.getByRole('button', { name: 'Open workspace selector' })).toBeVisible()
  })

  it('sets aria-expanded on the trigger based on dropdown state', () => {
    render(
      <SpaceSelectorDropdown selectedSpace={{ uuid: 'uuid-1', name: 'Company Space', safeCount: 0 }} spaces={[]} />,
    )

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows all space items when the dropdown is opened', () => {
    const spaces = [
      { uuid: 'uuid-1', name: 'Alpha', safeCount: 0 },
      { uuid: 'uuid-2', name: 'Beta', safeCount: 0 },
      { uuid: 'uuid-3', name: 'Gamma', safeCount: 0 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)

    const spaceItemButtons = screen
      .getAllByRole('button')
      .filter((btn) => spaces.some((s) => btn.querySelector('span')?.textContent === s.name))
    expect(spaceItemButtons).toHaveLength(3)
  })

  it('calls router.push with the correct spaceId when a space is selected', () => {
    const spaces = [
      { uuid: 'uuid-1', name: 'Alpha', safeCount: 0 },
      { uuid: 'uuid-2', name: 'Beta', safeCount: 0 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)

    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')
    fireEvent.click(betaButton!)

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: 'uuid-2' } })
  })

  it('routes and tracks by uuid for spaces that carry no numeric id', () => {
    const spaces = [
      { uuid: 'uuid-1', name: 'Alpha', safeCount: 0 },
      { uuid: 'uuid-2', name: 'Beta', safeCount: 3 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open workspace selector' }))
    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')
    fireEvent.click(betaButton!)

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: 'uuid-2' } })
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'uuid-2' }),
      expect.objectContaining({ from_workspace_id: 'uuid-1', to_workspace_id: 'uuid-2' }),
    )
  })

  it('tracks WORKSPACE_CREATE_STARTED event and navigates when "Add new space" is clicked', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Add new workspace'))

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'Workspace create started' }),
      expect.objectContaining({ entry_point: 'sidebar' }),
    )
    expect(mockPush).toHaveBeenCalledWith(AppRoutes.spaces.createSpace)
  })

  it('includes safe query param in create space navigation when safe is in the URL', () => {
    mockRouterQuery = { spaceId: '1', safe: '1:0xdeadbeef' }
    render(<SpaceSelectorDropdown selectedSpace={{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Add new workspace'))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.createSpace,
      query: { safe: '1:0xdeadbeef' },
    })
  })

  it('tracks OPEN_SPACE_LIST_PAGE event and navigates when "View all" is clicked', () => {
    render(<SpaceSelectorDropdown selectedSpace={{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }} spaces={[]} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('View all'))

    expect(trackEvent).toHaveBeenCalledWith(expect.objectContaining({ label: 'space_selector' }))
    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })

  describe('getDeterministicColor (avatar color from name)', () => {
    it('returns the same color for the same name', () => {
      expect(getDeterministicColor('My Space')).toBe(getDeterministicColor('My Space'))
    })

    it('returns different colors for different names', () => {
      const colors = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map(getDeterministicColor)
      expect(new Set(colors).size).toBe(colors.length)
    })
  })

  it('shows a checkmark only next to the currently selected space', () => {
    const spaces = [
      { uuid: 'uuid-1', name: 'Alpha', safeCount: 0 },
      { uuid: 'uuid-2', name: 'Beta', safeCount: 0 },
    ]
    render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

    const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
    fireEvent.click(trigger)

    const alphaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
    const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')

    expect(alphaButton?.querySelector('svg')).toBeInTheDocument()
    expect(betaButton?.querySelector('svg')).not.toBeInTheDocument()
  })

  describe('safe limit per workspace (addToWorkspace variant)', () => {
    const LIMIT = 40

    it('disables a space that has reached the safe limit', () => {
      const spaces = [
        { uuid: 'uuid-1', name: 'Full Space', safeCount: LIMIT, members: adminMembersForCurrentUser },
        { uuid: 'uuid-2', name: 'Empty Space', safeCount: 0, members: adminMembersForCurrentUser },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const fullButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Full Space')
      const emptyButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Empty Space')

      expect(fullButton).toBeDisabled()
      expect(emptyButton).not.toBeDisabled()
    })

    it('shows a tooltip with the limit message for a space at the limit', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'Full Space', safeCount: LIMIT, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText(/You can have up to /)).toBeInTheDocument()
    })

    it('does not show a limit tooltip for a space below the limit', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'Space', safeCount: LIMIT - 1 }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.queryByText(/You can have up to /)).not.toBeInTheDocument()
    })

    it('does not disable spaces at the limit in the default variant', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'Full Space', safeCount: LIMIT }]
      render(<SpaceSelectorDropdown triggerVariant="default" selectedSpace={spaces[0]} spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Open workspace selector' }))

      const fullButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Full Space')
      expect(fullButton).not.toBeDisabled()
    })

    it('shows the full tooltip text including the limit number', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'Full Space', safeCount: LIMIT, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText(`You can have up to ${LIMIT} Safes per workspace`)).toBeInTheDocument()
    })
  })

  describe('admin role gating (addToWorkspace variant)', () => {
    it('disables a space where the user is not an active admin', () => {
      const spaces = [
        { uuid: 'uuid-1', name: 'AdminSpace', safeCount: 0, members: adminMembersForCurrentUser },
        { uuid: 'uuid-2', name: 'MemberSpace', safeCount: 0, members: memberMembersForCurrentUser },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const adminBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'AdminSpace')
      const memberBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'MemberSpace')

      expect(adminBtn).not.toBeDisabled()
      expect(memberBtn).toBeDisabled()
    })

    it('shows the admin tooltip for non-admin spaces', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'MemberSpace', safeCount: 0, members: memberMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText('Only admins can add Safes to this workspace')).toBeInTheDocument()
    })

    it('prefers the admin tooltip over the limit tooltip when both apply', () => {
      const LIMIT = 40
      const spaces = [{ uuid: 'uuid-1', name: 'FullMember', safeCount: LIMIT, members: memberMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText('Only admins can add Safes to this workspace')).toBeInTheDocument()
      expect(screen.queryByText(/You can have up to /)).not.toBeInTheDocument()
    })

    it('does not gate by role in the default variant', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'MemberSpace', safeCount: 0, members: memberMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="default" selectedSpace={spaces[0]} spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Open workspace selector' }))

      const button = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'MemberSpace')
      expect(button).not.toBeDisabled()
      expect(screen.queryByText('Only admins can add Safes to this workspace')).not.toBeInTheDocument()
    })

    it('does not call addToSpace when a non-admin space item is clicked', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(true)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [{ uuid: 'uuid-1', name: 'MemberSpace', safeCount: 0, members: memberMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const memberBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'MemberSpace')
      await act(async () => {
        fireEvent.click(memberBtn!)
      })

      expect(mockAddToSpace).not.toHaveBeenCalled()
    })

    it('calls addToSpace when an admin space item is clicked', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(true)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [{ uuid: 'uuid-1', name: 'AdminSpace', safeCount: 0, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const adminBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'AdminSpace')
      await act(async () => {
        fireEvent.click(adminBtn!)
      })

      expect(mockAddToSpace).toHaveBeenCalledWith('uuid-1')
    })

    it('in a mixed list, only admin items trigger addToSpace', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(true)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [
        { uuid: 'uuid-1', name: 'AdminSpace', safeCount: 0, members: adminMembersForCurrentUser },
        { uuid: 'uuid-2', name: 'MemberSpace', safeCount: 0, members: memberMembersForCurrentUser },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const memberBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'MemberSpace')
      const adminBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'AdminSpace')

      await act(async () => {
        fireEvent.click(memberBtn!)
      })
      await act(async () => {
        fireEvent.click(adminBtn!)
      })

      expect(mockAddToSpace).toHaveBeenCalledTimes(1)
      expect(mockAddToSpace).toHaveBeenCalledWith('uuid-1')
    })
  })

  describe('already-in-workspace gating (addToWorkspace variant)', () => {
    const SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

    const setMembership = (membership: Record<string, Record<string, string[]>>) => {
      mockUseSpaceSafesGetV1Query.mockImplementation((...args: unknown[]) => {
        const { spaceId } = args[0] as { spaceId: string }
        const safes = membership[spaceId]
        return { currentData: safes ? { safes } : undefined }
      })
    }

    it('disables a space that already contains the current Safe', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] }, 'uuid-2': { '1': [] } })

      const spaces = [
        { uuid: 'uuid-1', name: 'AlreadyIn', safeCount: 1, members: adminMembersForCurrentUser },
        { uuid: 'uuid-2', name: 'NotIn', safeCount: 0, members: adminMembersForCurrentUser },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const alreadyInBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'AlreadyIn')
      const notInBtn = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'NotIn')

      expect(alreadyInBtn).toBeDisabled()
      expect(notInBtn).not.toBeDisabled()
    })

    it('shows the "already in workspace" tooltip for matching spaces', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'AlreadyIn', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText('Safe is already in this workspace')).toBeInTheDocument()
    })

    it('matches membership by current chainId only', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      mockChainId = '1'
      setMembership({ 'uuid-1': { '137': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'OtherChain', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const btn = screen.getAllByRole('button').find((b) => b.querySelector('span')?.textContent === 'OtherChain')
      expect(btn).not.toBeDisabled()
      expect(screen.queryByText('Safe is already in this workspace')).not.toBeInTheDocument()
    })

    it('prefers the "already in workspace" tooltip over the admin tooltip', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'MemberAlreadyIn', safeCount: 1, members: memberMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(screen.getByText('Safe is already in this workspace')).toBeInTheDocument()
      expect(screen.queryByText('Only admins can add Safes to this workspace')).not.toBeInTheDocument()
    })

    it('does not disable already-added spaces in the default variant', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'AlreadyIn', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="default" selectedSpace={spaces[0]} spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Open workspace selector' }))

      const btn = screen.getAllByRole('button').find((b) => b.querySelector('span')?.textContent === 'AlreadyIn')
      expect(btn).not.toBeDisabled()
      expect(screen.queryByText('Safe is already in this workspace')).not.toBeInTheDocument()
    })

    it('does not disable any space when no Safe is in the URL', () => {
      mockSafeAddressFromUrl = ''
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'Space', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const btn = screen.getAllByRole('button').find((b) => b.querySelector('span')?.textContent === 'Space')
      expect(btn).not.toBeDisabled()
    })

    it('skips the membership query while the dropdown is closed and fires it once opened', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'Space', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      expect(mockUseSpaceSafesGetV1Query).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 'uuid-1' }, { skip: false })
    })

    it('skips the membership query when the user is signed out', () => {
      mockIsAuthenticated = false
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS] } })

      const spaces = [{ uuid: 'uuid-1', name: 'Space', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 'uuid-1' }, { skip: true })
    })

    it('matches membership when the stored address differs in case from the URL address', () => {
      mockSafeAddressFromUrl = SAFE_ADDRESS
      setMembership({ 'uuid-1': { '1': [SAFE_ADDRESS.toLowerCase()] } })

      const spaces = [{ uuid: 'uuid-1', name: 'AlreadyIn', safeCount: 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const btn = screen.getAllByRole('button').find((b) => b.querySelector('span')?.textContent === 'AlreadyIn')
      expect(btn).toBeDisabled()
      expect(screen.getByText('Safe is already in this workspace')).toBeInTheDocument()
    })
  })

  describe('onSpaceAdded callback propagation', () => {
    it('passes onSpaceAdded to useAddSafeToSpace hook', () => {
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      const onSpaceAdded = jest.fn()
      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }]

      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} onSpaceAdded={onSpaceAdded} />)

      expect(useAddSafeToSpace).toHaveBeenCalledWith(expect.objectContaining({ onSpaceAdded }))
    })

    it('closes the dropdown after successfully adding a Safe to a Space', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(true)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))
      expect(screen.getByText('Alpha')).toBeInTheDocument()

      const alphaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      await act(async () => {
        fireEvent.click(alphaButton!)
      })

      expect(mockAddToSpace).toHaveBeenCalledWith('uuid-1')
      expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    })
  })

  describe('space selector interactions and loading states', () => {
    it('disables all space items while one is loading in addToWorkspace variant', () => {
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({
        addToSpace: jest.fn(),
        loadingSpaceId: 'uuid-1',
      })

      const spaces = [
        { uuid: 'uuid-1', name: 'Alpha', safeCount: 0 },
        { uuid: 'uuid-2', name: 'Beta', safeCount: 0 },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const alphaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')

      expect(alphaButton).toBeDisabled()
      expect(betaButton).toBeDisabled()
    })

    it('shows a loading spinner on the space item being added to in addToWorkspace variant', () => {
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({
        addToSpace: jest.fn(),
        loadingSpaceId: 'uuid-1',
      })

      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const alphaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Alpha')

      expect(alphaButton?.querySelector('svg')).toBeInTheDocument()
    })

    it('does not close the dropdown when adding a Safe fails', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(false)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))
      expect(screen.getByText('Alpha')).toBeInTheDocument()

      const alphaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      await act(async () => {
        fireEvent.click(alphaButton!)
      })

      expect(mockAddToSpace).toHaveBeenCalledWith('uuid-1')
      expect(screen.getByText('Alpha')).toBeInTheDocument()
    })

    it('navigates to the correct space in default variant when clicked', () => {
      const spaces = [
        { uuid: 'uuid-10', name: 'Gamma', safeCount: 0 },
        { uuid: 'uuid-20', name: 'Delta', safeCount: 0 },
      ]
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Open workspace selector' }))

      const deltaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Delta')
      fireEvent.click(deltaButton!)

      expect(mockPush).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: 'uuid-20' } })
    })
  })

  describe('edge cases and error states', () => {
    it('renders correctly with no spaces', () => {
      render(<SpaceSelectorDropdown selectedSpace={{ uuid: 'uuid-1', name: 'Space', safeCount: 0 }} spaces={[]} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      expect(screen.getByText('Add new workspace')).toBeInTheDocument()
      expect(screen.getByText('View all')).toBeInTheDocument()
    })

    it('renders correctly when selectedSpace is undefined', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }]
      render(<SpaceSelectorDropdown spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      expect(screen.getByText('Workspace')).toBeInTheDocument()
    })

    it('handles spaces with very long names', () => {
      const longName = 'A'.repeat(100)
      const spaces = [{ uuid: 'uuid-1', name: longName, safeCount: 0 }]
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      expect(trigger).toHaveTextContent(truncateSpaceName(longName, SPACE_SELECTOR_NAME_MAX_LENGTH))
    })

    it('handles space names with special characters for avatar initial', () => {
      const spaces = [{ uuid: 'uuid-1', name: '123SpecialSpace', safeCount: 0 }]
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const avatarFallback = screen.getByTestId('avatar-fallback')
      expect(avatarFallback).toHaveTextContent('1')
    })

    it('handles single space in list', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'OnlySpace', safeCount: 0 }]
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      const spaceButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'OnlySpace')
      expect(spaceButton).toBeInTheDocument()
    })

    it('disables spaces when multiple are at the safe limit', () => {
      const LIMIT = 40
      const spaces = [
        { uuid: 'uuid-1', name: 'Full1', safeCount: LIMIT, members: adminMembersForCurrentUser },
        { uuid: 'uuid-2', name: 'Full2', safeCount: LIMIT, members: adminMembersForCurrentUser },
        { uuid: 'uuid-3', name: 'Available', safeCount: LIMIT - 1, members: adminMembersForCurrentUser },
      ]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const full1 = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Full1')
      const full2 = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Full2')
      const available = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Available')

      expect(full1).toBeDisabled()
      expect(full2).toBeDisabled()
      expect(available).not.toBeDisabled()
    })

    it('handles space with safeCount exactly one below the limit', () => {
      const LIMIT = 40
      const spaces = [{ uuid: 'uuid-1', name: 'AlmostFull', safeCount: LIMIT - 1, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const button = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'AlmostFull')
      expect(button).not.toBeDisabled()
    })

    it('multiple open/close cycles preserve state correctly', () => {
      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0 }]
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })

      // First cycle
      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Workspaces')).toBeInTheDocument()

      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Workspaces')).not.toBeInTheDocument()

      // Second cycle
      fireEvent.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Workspaces')).toBeInTheDocument()
    })

    it('correctly displays checkmark only for the selected space after re-renders', () => {
      const spaces = [
        { uuid: 'uuid-1', name: 'Alpha', safeCount: 0 },
        { uuid: 'uuid-2', name: 'Beta', safeCount: 0 },
      ]
      const { rerender } = render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      let alphaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      expect(alphaButton?.querySelector('svg')).toBeInTheDocument()

      rerender(<SpaceSelectorDropdown selectedSpace={spaces[1]} spaces={spaces} />)

      const betaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Beta')
      alphaButton = screen.getAllByRole('button').find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      expect(betaButton?.querySelector('svg')).toBeInTheDocument()
      expect(alphaButton?.querySelector('svg')).not.toBeInTheDocument()
    })

    it('does not throw when onSpaceAdded is not provided', async () => {
      const mockAddToSpace = jest.fn().mockResolvedValue(true)
      const { useAddSafeToSpace } = jest.requireMock('../../../hooks/useAddSafeToSpace') as {
        useAddSafeToSpace: jest.Mock
      }
      useAddSafeToSpace.mockReturnValue({ addToSpace: mockAddToSpace, loadingSpaceId: null })

      const spaces = [{ uuid: 'uuid-1', name: 'Alpha', safeCount: 0, members: adminMembersForCurrentUser }]
      render(<SpaceSelectorDropdown triggerVariant="addToWorkspace" spaces={spaces} />)

      fireEvent.click(screen.getByRole('button', { name: 'Add Safe to workspace' }))

      const alphaButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Alpha')
      await act(async () => {
        fireEvent.click(alphaButton!)
      })

      expect(mockAddToSpace).toHaveBeenCalledWith('uuid-1')
    })
  })

  describe('spaces limit (max 10 workspaces)', () => {
    it('disables "Add new space" button when spaces are at the limit', () => {
      const spaces = Array.from({ length: SPACES_LIMIT }, (_, i) => ({
        id: i + 1,
        uuid: `uuid-${i + 1}`,
        name: `Space${i + 1}`,
        safeCount: 0,
      }))
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      const addNewSpaceButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Add new workspace')
      expect(addNewSpaceButton).toBeDisabled()
    })

    it('shows a tooltip when "Add new space" button is disabled due to spaces limit', () => {
      const spaces = Array.from({ length: SPACES_LIMIT }, (_, i) => ({
        id: i + 1,
        uuid: `uuid-${i + 1}`,
        name: `Space${i + 1}`,
        safeCount: 0,
      }))
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      expect(screen.getByText(`Limit of ${SPACES_LIMIT} workspaces reached`)).toBeInTheDocument()
    })

    it('does not disable "Add new space" button when spaces are below the limit', () => {
      const spaces = Array.from({ length: SPACES_LIMIT - 1 }, (_, i) => ({
        id: i + 1,
        uuid: `uuid-${i + 1}`,
        name: `Space${i + 1}`,
        safeCount: 0,
      }))
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      const addNewSpaceButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Add new workspace')
      expect(addNewSpaceButton).not.toBeDisabled()
    })

    it('does not show a tooltip when "Add new space" button is enabled', () => {
      const spaces = Array.from({ length: SPACES_LIMIT - 1 }, (_, i) => ({
        id: i + 1,
        uuid: `uuid-${i + 1}`,
        name: `Space${i + 1}`,
        safeCount: 0,
      }))
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      expect(screen.queryByText(`Limit of ${SPACES_LIMIT} workspaces reached`)).not.toBeInTheDocument()
    })

    it('disables "Add new space" button when spaces exceed the limit', () => {
      const spaces = Array.from({ length: SPACES_LIMIT + 1 }, (_, i) => ({
        id: i + 1,
        uuid: `uuid-${i + 1}`,
        name: `Space${i + 1}`,
        safeCount: 0,
      }))
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      const addNewSpaceButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('span')?.textContent === 'Add new workspace')
      expect(addNewSpaceButton).toBeDisabled()
    })

    it('shows the correct limit message in the tooltip', () => {
      const spaces = Array.from({ length: SPACES_LIMIT }, (_, i) => ({
        id: i + 1,
        uuid: `uuid-${i + 1}`,
        name: `Space${i + 1}`,
        safeCount: 0,
      }))
      render(<SpaceSelectorDropdown selectedSpace={spaces[0]} spaces={spaces} />)

      const trigger = screen.getByRole('button', { name: 'Open workspace selector' })
      fireEvent.click(trigger)

      expect(screen.getByText(`Limit of ${SPACES_LIMIT} workspaces reached`)).toBeInTheDocument()
    })
  })
})
