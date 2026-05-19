import { render, screen } from '@testing-library/react'
import { SidebarTopBar } from '../SidebarTopBar'
import { AppRoutes } from '@/config/routes'

const mockUseRouter = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => mockUseRouter(),
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
  const MockSafeLogo = ({ href, 'data-testid': testId }: { href?: string; 'data-testid'?: string }) => (
    <a data-testid={testId} href={href} />
  )
  MockSafeLogo.displayName = 'SafeLogo'
  return { __esModule: true, default: MockSafeLogo }
})

describe('SidebarTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ pathname: AppRoutes.welcome.accounts })
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
})
