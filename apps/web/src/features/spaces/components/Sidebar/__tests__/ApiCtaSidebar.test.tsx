import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ApiCtaSidebar } from '../ApiCtaSidebar'

const mockSetIsCollapsed = jest.fn()
let mockIsCollapsed = false
let mockSidebarState: 'expanded' | 'collapsed' = 'expanded'

jest.mock('@/services/local-storage/useLocalStorage', () => jest.fn(() => [mockIsCollapsed, mockSetIsCollapsed]))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    children,
    onClick,
    render,
    'data-testid': testId,
  }: {
    children: ReactNode
    onClick?: () => void
    render?: React.ReactElement<{ href?: string; target?: string; rel?: string }>
    'data-testid'?: string
  }) => (
    <button data-testid={testId} onClick={onClick}>
      {render ? (
        <a href={render.props.href} target={render.props.target} rel={render.props.rel}>
          {children}
        </a>
      ) : (
        children
      )}
    </button>
  ),
  useSidebar: () => ({ state: mockSidebarState, isMobile: false }),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    render: renderProp,
  }: {
    children: ReactNode
    render?: React.ReactElement<{ href: string; target?: string; rel?: string }>
  }) =>
    renderProp ? (
      <a href={renderProp.props.href} target={renderProp.props.target} rel={renderProp.props.rel}>
        {children}
      </a>
    ) : (
      <button>{children}</button>
    ),
}))

jest.mock('../styles.module.css', () => ({}))

describe('ApiCtaSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsCollapsed = false
    mockSidebarState = 'expanded'
  })

  describe('expanded state (default)', () => {
    it('renders the expanded card', () => {
      render(<ApiCtaSidebar />)

      expect(screen.getByTestId('api-cta-sidebar')).toBeInTheDocument()
    })

    it('renders the API icon image', () => {
      render(<ApiCtaSidebar />)

      const images = screen.getAllByAltText('API')
      expect(images[0]).toHaveAttribute('src', '/images/spaces/api-sidebar.svg')
    })

    it('renders the description', () => {
      render(<ApiCtaSidebar />)

      expect(
        screen.getByText(
          'Authenticated access, predictable quotas, and webhooks for teams that rely on Safe as critical infrastructure.',
        ),
      ).toBeInTheDocument()
    })

    it('renders the CTA link with correct attributes', () => {
      render(<ApiCtaSidebar />)

      const link = screen.getByRole('link', { name: /Get API key/i })
      expect(link).toHaveAttribute('href', 'https://developer.safe.global/login')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders the minimize button', () => {
      render(<ApiCtaSidebar />)

      expect(screen.getByTestId('api-cta-minimize')).toBeInTheDocument()
    })

    it('does not render the collapsed button', () => {
      render(<ApiCtaSidebar />)

      expect(screen.queryByTestId('api-cta-collapsed')).not.toBeInTheDocument()
    })
  })

  describe('minimizing', () => {
    it('calls setIsCollapsed(true) when the minimize button is clicked', () => {
      render(<ApiCtaSidebar />)

      fireEvent.click(screen.getByTestId('api-cta-minimize'))

      expect(mockSetIsCollapsed).toHaveBeenCalledWith(true)
    })
  })

  describe('collapsed state', () => {
    beforeEach(() => {
      mockIsCollapsed = true
    })

    it('renders the collapsed menu button', () => {
      render(<ApiCtaSidebar />)

      expect(screen.getByTestId('api-cta-collapsed')).toBeInTheDocument()
    })

    it('renders "API" label in collapsed button', () => {
      render(<ApiCtaSidebar />)

      expect(screen.getByText('API')).toBeInTheDocument()
    })

    it('renders the API icon in collapsed button', () => {
      render(<ApiCtaSidebar />)

      expect(screen.getByAltText('API')).toHaveAttribute('src', '/images/spaces/api-sidebar.svg')
    })

    it('does not render the expanded card', () => {
      render(<ApiCtaSidebar />)

      expect(screen.queryByTestId('api-cta-sidebar')).not.toBeInTheDocument()
    })

    it('calls setIsCollapsed(false) when the collapsed button is clicked', () => {
      render(<ApiCtaSidebar />)

      fireEvent.click(screen.getByTestId('api-cta-collapsed'))

      expect(mockSetIsCollapsed).toHaveBeenCalledWith(false)
    })
  })

  describe('icon-collapsed sidebar state', () => {
    beforeEach(() => {
      mockSidebarState = 'collapsed'
      mockIsCollapsed = false
    })

    it('renders the collapsed menu button even when CTA is expanded', () => {
      render(<ApiCtaSidebar />)

      expect(screen.getByTestId('api-cta-collapsed')).toBeInTheDocument()
      expect(screen.queryByTestId('api-cta-sidebar')).not.toBeInTheDocument()
    })

    it('links to the API docs when collapsed', () => {
      render(<ApiCtaSidebar />)

      const link = screen.getByRole('link', { name: /API/i })
      expect(link).toHaveAttribute('href', 'https://developer.safe.global/login')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })
})
