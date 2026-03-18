import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarTopBar } from '../SidebarTopBar'
import { AppRoutes } from '@/config/routes'

const mockPush = jest.fn()
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

describe('SidebarTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush, pathname: AppRoutes.welcome.accounts })
  })

  it('renders all required elements', () => {
    render(<SidebarTopBar />)

    expect(screen.getByTestId('sidebar-top-bar')).toBeInTheDocument()
    expect(screen.getByTestId('logo-container')).toBeInTheDocument()
    expect(screen.getByTestId('logo-image')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()
  })

  it('renders logo with correct attributes', () => {
    render(<SidebarTopBar />)

    const logo = screen.getByTestId('logo-image')
    expect(logo).toHaveAttribute('role', 'img')
    expect(logo).toHaveAttribute('aria-label', 'Safe')
  })

  it('applies horizontal layout when sidebar is expanded', () => {
    const { useSidebar } = require('@/components/ui/sidebar')
    useSidebar.mockReturnValue({ state: 'expanded' })

    render(<SidebarTopBar />)

    const topBar = screen.getByTestId('sidebar-top-bar')
    expect(topBar).toHaveClass('flex', 'items-center', 'justify-between')
  })

  it('applies vertical layout when sidebar is collapsed', () => {
    const { useSidebar } = require('@/components/ui/sidebar')
    useSidebar.mockReturnValue({ state: 'collapsed' })

    render(<SidebarTopBar />)

    const topBar = screen.getByTestId('sidebar-top-bar')
    expect(topBar).toHaveClass('flex-col', 'items-center', 'justify-center', 'gap-2')
  })

  it('navigates to /welcome when on /welcome/accounts', async () => {
    mockUseRouter.mockReturnValue({ push: mockPush, pathname: AppRoutes.welcome.accounts })
    const user = userEvent.setup()

    render(<SidebarTopBar />)

    await user.click(screen.getByTestId('logo-container'))

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.index)
  })

  it('navigates to /welcome/accounts when not on /welcome/accounts', async () => {
    mockUseRouter.mockReturnValue({ push: mockPush, pathname: AppRoutes.welcome.index })
    const user = userEvent.setup()

    render(<SidebarTopBar />)

    await user.click(screen.getByTestId('logo-container'))

    expect(mockPush).toHaveBeenCalledWith(AppRoutes.welcome.accounts)
  })
})
