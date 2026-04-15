import { render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AddToSpacePopupModal } from '../AddToSpacePopupModal'
import { AppRoutes } from '@/config/routes'

let mockRouterQuery: Record<string, string> = {}

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockRouterQuery }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

const serializeHref = (href: string | { pathname: string; query?: Record<string, string> }): string => {
  if (typeof href === 'string') return href
  const params = new URLSearchParams(href.query).toString()
  return params ? `${href.pathname}?${params}` : href.pathname
}

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    render: renderProp,
  }: {
    children: ReactNode
    render?: ReactElement<{ href?: string | { pathname: string; query?: Record<string, string> } }>
  }) =>
    renderProp?.props?.href ? (
      <a href={serializeHref(renderProp.props.href)}>{children}</a>
    ) : (
      <button type="button">{children}</button>
    ),
}))

jest.mock('@/components/ui/typography', () => ({
  Typography: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

jest.mock('@/components/ui/dialog', () => ({
  DialogClose: ({ children, 'aria-label': ariaLabel }: { children: ReactNode; 'aria-label'?: string }) => (
    <button type="button" aria-label={ariaLabel}>
      {children}
    </button>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('AddToSpacePopupModal', () => {
  beforeEach(() => {
    mockRouterQuery = {}
  })

  it('renders the "Add to Space" title', () => {
    render(<AddToSpacePopupModal />)

    expect(screen.getByText('Add to Space')).toBeInTheDocument()
  })

  it('renders all three benefit items', () => {
    render(<AddToSpacePopupModal />)

    expect(screen.getByText('Keep all related Safes in one shared workspace')).toBeInTheDocument()
    expect(screen.getByText('Give teams shared context around transactions and activity')).toBeInTheDocument()
    expect(screen.getByText('Streamline coordination across initiators, approvers, and executors')).toBeInTheDocument()
  })

  it('renders a "Create a Space" link pointing to the create space route', () => {
    render(<AddToSpacePopupModal />)

    const link = screen.getByRole('link', { name: /Create a Space/i })
    expect(link).toHaveAttribute('href', AppRoutes.spaces.createSpace)
  })

  it('includes safe query param in "Create a Space" link when safe is in the URL', () => {
    mockRouterQuery = { safe: '1:0xdeadbeef' }
    render(<AddToSpacePopupModal />)

    const link = screen.getByRole('link', { name: /Create a Space/i })
    expect(link).toHaveAttribute('href', `${AppRoutes.spaces.createSpace}?safe=1%3A0xdeadbeef`)
  })

  it('renders a close button', () => {
    render(<AddToSpacePopupModal />)

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})
