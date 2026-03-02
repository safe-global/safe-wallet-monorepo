import { render, screen } from '@testing-library/react'
import { SidebarTopBar } from '../SidebarTopBar'

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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    className,
    'data-testid': testId,
  }: {
    src: string
    alt: string
    width: number
    height: number
    className?: string
    'data-testid'?: string
  }) => <img data-testid={testId} src={src} alt={alt} width={width} height={height} className={className} />,
}))

describe('SidebarTopBar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    expect(logo).toHaveAttribute('src', '/images/logo-no-text.svg')
    expect(logo).toHaveAttribute('alt', 'Safe')
    expect(logo).toHaveAttribute('width', '24')
    expect(logo).toHaveAttribute('height', '24')
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
})
