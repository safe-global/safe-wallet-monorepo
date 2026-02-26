import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SpacesEnhancedSidebar } from '../SpacesEnhancedSidebar'

const mockUseSidebarHydrated = jest.fn()
const mockUseAppSelector = jest.fn()
const mockUseCurrentSpaceId = jest.fn()
const mockUseIsSpaceRoute = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()
const mockUseSpacesGetV1Query = jest.fn()
const mockGetNonDeclinedSpaces = jest.fn()

jest.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: ReactNode }) => <div data-testid="sidebar-provider">{children}</div>,
}))

jest.mock('../hooks/useSidebarHydrated', () => ({
  useSidebarHydrated: () => mockUseSidebarHydrated(),
}))

jest.mock('@/store', () => ({
  useAppSelector: (...args: unknown[]) => mockUseAppSelector(...args),
}))

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
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

jest.mock('../index', () => ({
  EnhancedSidebar: ({ type, spaceName }: { type: string; spaceName: string }) => (
    <div data-testid="enhanced-sidebar">{`${type}:${spaceName}`}</div>
  ),
}))

jest.mock('../SidebarSkeleton', () => ({
  SidebarSkeleton: () => <div data-testid="sidebar-skeleton">Skeleton</div>,
}))

describe('SpacesEnhancedSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAppSelector.mockReturnValue(true)
    mockUseCurrentSpaceId.mockReturnValue('1')
    mockUseIsSpaceRoute.mockReturnValue(true)
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 1 } })
    mockUseSpacesGetV1Query.mockReturnValue({ currentData: [{ id: 1, name: 'Core Space' }] })
    mockGetNonDeclinedSpaces.mockReturnValue([{ id: 1, name: 'Core Space' }])
  })

  it('renders skeleton while hydration is pending', () => {
    mockUseSidebarHydrated.mockReturnValue(false)

    render(<SpacesEnhancedSidebar />)

    expect(screen.getByTestId('sidebar-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('enhanced-sidebar')).not.toBeInTheDocument()
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

    render(<SpacesEnhancedSidebar />)

    expect(screen.getByTestId('enhanced-sidebar')).toHaveTextContent('safe:Core Space')
  })
})
