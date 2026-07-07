import { render, screen } from '@testing-library/react'
import { SidebarTopBar } from '../SidebarTopBar'
import { AppRoutes } from '@/config/routes'

const mockUseRouter = jest.fn()
const mockUseSafeAddressFromUrl = jest.fn()
const mockUseIsSpaceRoute = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeAddressFromUrl: () => mockUseSafeAddressFromUrl(),
}))

jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: () => mockUseIsSpaceRoute(),
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className, 'data-testid': testId }: { className?: string; 'data-testid'?: string }) => (
    <button data-testid={testId} className={className}>
      Toggle
    </button>
  ),
  useSidebar: jest.fn(() => ({
    state: 'expanded',
  })),
}))

jest.mock('@/components/common/SafeLogo', () => {
  const MockSafeLogo = ({
    href,
    showBackArrow,
    'data-testid': testId,
  }: {
    href?: string
    showBackArrow?: boolean
    'data-testid'?: string
  }) => <a data-testid={testId} href={href} data-back-arrow={String(Boolean(showBackArrow))} />
  MockSafeLogo.displayName = 'SafeLogo'
  return { __esModule: true, default: MockSafeLogo }
})

describe('SidebarTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.welcome.accounts })
    mockUseSafeAddressFromUrl.mockReturnValue('')
    mockUseIsSpaceRoute.mockReturnValue(false)
    const { useSidebar } = require('@/components/ui/sidebar')
    useSidebar.mockReturnValue({ state: 'expanded' })
  })

  it('renders all required elements', () => {
    render(<SidebarTopBar />)

    expect(screen.getByTestId('sidebar-top-bar')).toBeInTheDocument()
    expect(screen.getByTestId('logo-container')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
  })

  it('applies expanded top bar sizing and state when sidebar is expanded', () => {
    const { useSidebar } = require('@/components/ui/sidebar')
    useSidebar.mockReturnValue({ state: 'expanded' })

    render(<SidebarTopBar />)

    const topBar = screen.getByTestId('sidebar-top-bar')
    expect(topBar).toHaveAttribute('data-sidebar-state', 'expanded')
    expect(topBar).toHaveClass('h-10')
  })

  it('applies collapsed top bar sizing and state when sidebar is collapsed', () => {
    const { useSidebar } = require('@/components/ui/sidebar')
    useSidebar.mockReturnValue({ state: 'collapsed' })

    render(<SidebarTopBar />)

    const topBar = screen.getByTestId('sidebar-top-bar')
    expect(topBar).toHaveAttribute('data-sidebar-state', 'collapsed')
    expect(topBar).toHaveClass('min-h-16')
  })

  it('passes /welcome href to SafeLogo when on /welcome/accounts', () => {
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.welcome.accounts })

    render(<SidebarTopBar />)

    expect(screen.getByTestId('logo-container')).toHaveAttribute('href', AppRoutes.welcome.index)
  })

  it('passes /welcome/accounts href to SafeLogo when not on /welcome/accounts', () => {
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.welcome.index })

    render(<SidebarTopBar />)

    expect(screen.getByTestId('logo-container')).toHaveAttribute('href', AppRoutes.welcome.accounts)
  })

  it('shows the back-arrow pill linking to /welcome/accounts on an individual safe', () => {
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.home })
    mockUseSafeAddressFromUrl.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')

    render(<SidebarTopBar />)

    const logo = screen.getByTestId('logo-container')
    expect(logo).toHaveAttribute('data-back-arrow', 'true')
    expect(logo).toHaveAttribute('href', AppRoutes.welcome.accounts)
  })

  it('shows the back-arrow pill inside a space route', () => {
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.spaces.index })
    mockUseIsSpaceRoute.mockReturnValue(true)

    render(<SidebarTopBar />)

    const logo = screen.getByTestId('logo-container')
    expect(logo).toHaveAttribute('data-back-arrow', 'true')
    expect(logo).toHaveAttribute('href', AppRoutes.welcome.accounts)
  })

  it('does not show the back-arrow pill when the sidebar is collapsed', () => {
    const { useSidebar } = require('@/components/ui/sidebar')
    useSidebar.mockReturnValue({ state: 'collapsed' })
    mockUseSafeAddressFromUrl.mockReturnValue('0x1234567890abcdef1234567890abcdef12345678')

    render(<SidebarTopBar />)

    // Still links home, but as the plain logo (no room for the pill when collapsed).
    const logo = screen.getByTestId('logo-container')
    expect(logo).toHaveAttribute('data-back-arrow', 'false')
    expect(logo).toHaveAttribute('href', AppRoutes.welcome.accounts)
  })

  it('keeps the plain logo on the welcome accounts view (no safe, no space)', () => {
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.welcome.accounts })

    render(<SidebarTopBar />)

    expect(screen.getByTestId('logo-container')).toHaveAttribute('data-back-arrow', 'false')
  })
})
