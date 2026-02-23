import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SidebarCommonFooter } from '../SidebarCommonFooter'

const mockUseAppDispatch = jest.fn()
const mockUseDarkMode = jest.fn()
const mockUseLocalStorage = jest.fn()

jest.mock('@/store', () => ({
  useAppDispatch: () => mockUseAppDispatch(),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => mockUseDarkMode(),
}))

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: () => mockUseLocalStorage(),
}))

// Mock sidebar UI components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarFooter: ({ children, 'data-testid': testId }: { children: ReactNode; 'data-testid'?: string }) => (
    <div data-testid={testId}>{children}</div>
  ),
  SidebarMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, render: renderProp, className, 'data-testid': testId }: any) =>
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
  Switch: ({ id, checked, onCheckedChange }: any) => (
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

jest.mock('@/config/constants', () => ({
  IS_PRODUCTION: true,
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
    mockUseAppDispatch.mockReturnValue(jest.fn())
    mockUseDarkMode.mockReturnValue(false)
    mockUseLocalStorage.mockReturnValue([false, jest.fn()])
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
    expect(screen.queryByText('Use prod CGW')).not.toBeInTheDocument()
  })
})
