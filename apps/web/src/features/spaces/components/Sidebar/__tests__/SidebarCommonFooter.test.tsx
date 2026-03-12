import { render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { SidebarCommonFooter } from '../SidebarCommonFooter'

const mockUseAppDispatch = jest.fn()
const mockUseDarkMode = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockUseAppDispatch(),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => mockUseDarkMode(),
}))

// Mock sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarFooter: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    children,
    render: renderProp,
    className,
    'data-testid': testId,
  }: {
    children: ReactNode
    render?: ReactElement<{ href: string; target?: string; rel?: string }>
    className?: string
    'data-testid'?: string
  }) =>
    renderProp ? (
      <a
        data-testid={testId}
        className={className}
        href={renderProp.props.href}
        target={renderProp.props.target}
        rel={renderProp.props.rel}
      >
        {children}
      </a>
    ) : (
      <button data-testid={testId} className={className}>
        {children}
      </button>
    ),
}))

jest.mock('@/components/ui/switch', () => ({
  Switch: ({
    id,
    checked,
    onCheckedChange,
  }: {
    id: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
      data-testid={id}
    />
  ),
}))

jest.mock('@/components/ui/field', () => ({
  Field: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children, htmlFor }: { children: ReactNode; htmlFor: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

let isProductionMock = true
jest.mock('@/config/constants', () => ({
  get IS_PRODUCTION() {
    return isProductionMock
  },
}))

// Mock icons
jest.mock('../config', () => ({
  icons: {
    CircleHelp: () => <div data-testid="help-icon">CircleHelp</div>,
  },
}))

describe('SidebarCommonFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isProductionMock = true
    mockUseAppDispatch.mockReturnValue(jest.fn())
    mockUseDarkMode.mockReturnValue(false)
  })

  it('renders footer and help entry', () => {
    render(<SidebarCommonFooter />)

    expect(screen.getByTestId('sidebar-common-footer')).toBeInTheDocument()
    expect(screen.getByTestId('list-item-need-help')).toBeInTheDocument()
    expect(screen.getByTestId('help-icon')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('renders help link with correct attributes', () => {
    render(<SidebarCommonFooter />)

    const helpLink = screen.getByRole('link', { name: /Help/i })
    expect(helpLink).toHaveAttribute('href', 'https://help.safe.global/en/')
    expect(helpLink).toHaveAttribute('target', '_blank')
    expect(helpLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not render dev toggles in production', () => {
    render(<SidebarCommonFooter />)

    expect(screen.queryByText('Dark mode')).not.toBeInTheDocument()
  })

  describe('dev mode (IS_PRODUCTION = false)', () => {
    beforeEach(() => {
      isProductionMock = false
    })

    it('renders the Dark mode toggle', () => {
      render(<SidebarCommonFooter />)

      expect(screen.getByRole('checkbox', { name: /Dark mode/i })).toBeInTheDocument()
    })
  })
})
