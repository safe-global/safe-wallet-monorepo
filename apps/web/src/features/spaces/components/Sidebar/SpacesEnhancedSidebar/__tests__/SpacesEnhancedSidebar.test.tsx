import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SpacesEnhancedSidebar } from '../SpacesEnhancedSidebar'

const mockUseSidebarHydrated = jest.fn()
const mockUseAppSelector = jest.fn()
const mockUseCurrentSpaceId = jest.fn()
const mockUseRouter = jest.fn()
const mockUseIsSpaceRoute = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseSpacesGetV1Query = jest.fn()
const mockGetNonDeclinedSpaces = jest.fn()
const mockUseSidebar = jest.fn()
const mockUseIsQualifiedSafe = jest.fn()

jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div data-testid="sidebar-provider">{children}</div>,
  useSidebar: () => mockUseSidebar(),
  Sidebar: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  ),
  SidebarHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

jest.mock('../../SidebarTopBar', () => ({
  SidebarTopBar: () => <div data-testid="sidebar-top-bar" />,
}))

jest.mock('../../hooks/useSidebarHydrated', () => ({
  useSidebarHydrated: () => mockUseSidebarHydrated(),
}))

jest.mock('@/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/features/spaces/hooks/useIsQualifiedSafe', () => ({
  __esModule: true,
  default: () => mockUseIsQualifiedSafe(),
}))

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: () => mockUseIsSpaceRoute(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: (...args: unknown[]) => mockUseUsersGetWithWalletsV1Query(...args),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetV1Query: (...args: unknown[]) => mockUseSpacesGetV1Query(...args),
}))

jest.mock('@/features/spaces/utils', () => ({
  getNonDeclinedSpaces: (...args: unknown[]) => mockGetNonDeclinedSpaces(...args),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('../../index', () => ({
  EnhancedSidebar: ({ type, selectedSpace }: { type: string; selectedSpace?: { name: string } }) => (
    <div data-testid="enhanced-sidebar">{`${type}:${selectedSpace?.name ?? ''}`}</div>
  ),
}))

describe('SpacesEnhancedSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseSidebar.mockReturnValue({ open: true })
    mockUseAppSelector.mockReturnValue(true)
    mockUseCurrentSpaceId.mockReturnValue('1')
    mockUseRouter.mockReturnValue({ query: { spaceId: '1' } })
    mockUseIsSpaceRoute.mockReturnValue(true)
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: [{ id: 1, uuid: '1', name: 'Core Space' }] })
    mockGetNonDeclinedSpaces.mockReturnValue([{ id: 1, uuid: '1', name: 'Core Space' }])
    mockUseIsQualifiedSafe.mockReturnValue(false)
  })

  it('renders the skeleton until hydration completes', () => {
    mockUseSidebarHydrated.mockReturnValue(false)

    render(<SpacesEnhancedSidebar />)

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('enhanced-sidebar')).not.toBeInTheDocument()
  })

  it('replaces the skeleton with the sidebar after hydration', () => {
    mockUseSidebarHydrated.mockReturnValue(true)

    render(<SpacesEnhancedSidebar />)

    expect(screen.queryByTestId('sidebar-skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('enhanced-sidebar')).toBeInTheDocument()
  })

  it('renders spaces variant after hydration when on a space route', () => {
    mockUseSidebarHydrated.mockReturnValue(true)
    mockUseIsSpaceRoute.mockReturnValue(true)

    render(<SpacesEnhancedSidebar />)

    expect(screen.getByTestId('enhanced-sidebar')).toHaveTextContent('spaces:Core Space')
  })

  it('renders safe variant after hydration when not on a space route', () => {
    mockUseSidebarHydrated.mockReturnValue(true)
    mockUseIsSpaceRoute.mockReturnValue(false)
    mockUseRouter.mockReturnValue({ query: { spaceId: '1' } })

    render(<SpacesEnhancedSidebar />)

    expect(screen.getByTestId('enhanced-sidebar')).toHaveTextContent('safe:Core Space')
  })

  it('renders back to space when qualified safe has no spaceId in query', () => {
    mockUseSidebarHydrated.mockReturnValue(true)
    mockUseIsSpaceRoute.mockReturnValue(false)
    mockUseRouter.mockReturnValue({ query: {} })
    mockUseIsQualifiedSafe.mockReturnValue(true)

    render(<SpacesEnhancedSidebar />)

    expect(screen.getByTestId('enhanced-sidebar')).toHaveTextContent('safe:Core Space')
  })
})

describe('SidebarStateReporter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSidebarHydrated.mockReturnValue(false)
    mockUseAppSelector.mockReturnValue(false)
    mockUseCurrentSpaceId.mockReturnValue(undefined)
    mockUseRouter.mockReturnValue({ query: {} })
    mockUseIsSpaceRoute.mockReturnValue(false)
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({})
    mockUseSpacesGetV1Query.mockReturnValue({})
    mockGetNonDeclinedSpaces.mockReturnValue([])
    mockUseIsQualifiedSafe.mockReturnValue(false)
  })

  it('calls onOpenChange with true when sidebar is open', () => {
    mockUseSidebar.mockReturnValue({ open: true })
    const onOpenChange = jest.fn()

    render(<SpacesEnhancedSidebar onOpenChange={onOpenChange} />)

    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('calls onOpenChange with false when sidebar is collapsed', () => {
    mockUseSidebar.mockReturnValue({ open: false })
    const onOpenChange = jest.fn()

    render(<SpacesEnhancedSidebar onOpenChange={onOpenChange} />)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not throw when onOpenChange is not provided', () => {
    mockUseSidebar.mockReturnValue({ open: true })

    expect(() => render(<SpacesEnhancedSidebar />)).not.toThrow()
  })
})
