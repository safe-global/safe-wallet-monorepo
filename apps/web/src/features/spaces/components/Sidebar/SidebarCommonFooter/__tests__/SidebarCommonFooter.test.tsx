import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { SidebarCommonFooter } from '../SidebarCommonFooter'

const mockUseAppDispatch = jest.fn()
const mockUseDarkMode = jest.fn()
const mockTrackEvent = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  OVERVIEW_EVENTS: { HELP_CENTER: { action: 'Open Help Center' } },
  MixpanelEventParams: { SIDEBAR_ELEMENT: 'sidebarElement' },
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockUseAppDispatch(),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => mockUseDarkMode(),
}))

jest.mock('@/components/common/HelpMenu', () => ({
  __esModule: true,
  default: ({ anchorEl, onClose }: { anchorEl: HTMLElement | null; onClose: () => void }) =>
    anchorEl ? <div data-testid="help-menu" role="menu" onClick={onClose} /> : null,
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
    className,
    'data-testid': testId,
    onClick,
  }: {
    children: ReactNode
    className?: string
    'data-testid'?: string
    onClick?: React.MouseEventHandler<HTMLButtonElement>
  }) => (
    <button data-testid={testId} className={className} onClick={onClick}>
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
jest.mock('../../config', () => ({
  icons: {
    CircleHelp: () => <div data-testid="help-icon">CircleHelp</div>,
  },
}))

jest.mock('../../ApiCtaSidebar', () => ({
  ApiCtaSidebar: () => <div data-testid="api-cta-sidebar" />,
}))

jest.mock('../../SidebarIndexingStatus', () => ({
  SidebarIndexingStatus: () => <div data-testid="indexing-status" />,
}))

describe('SidebarCommonFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isProductionMock = true
    mockUseAppDispatch.mockReturnValue(jest.fn())
    mockUseDarkMode.mockReturnValue(false)
  })

  it('fires HELP_CENTER tracking event when clicking the Help button', () => {
    render(<SidebarCommonFooter />)
    fireEvent.click(screen.getByTestId('list-item-need-help'))

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'Open Help Center' }),
      expect.objectContaining({ sidebarElement: 'Help Center' }),
    )
  })

  it('renders footer and help entry', () => {
    render(<SidebarCommonFooter />)

    expect(screen.getByTestId('sidebar-common-footer')).toBeInTheDocument()
    expect(screen.getByTestId('list-item-need-help')).toBeInTheDocument()
    expect(screen.getByTestId('help-icon')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('renders the indexing status next to Help', () => {
    render(<SidebarCommonFooter />)
    expect(screen.getByTestId('indexing-status')).toBeInTheDocument()
  })

  it('opens help menu when Help button is clicked', () => {
    render(<SidebarCommonFooter />)

    expect(screen.queryByTestId('help-menu')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('list-item-need-help'))
    expect(screen.getByTestId('help-menu')).toBeInTheDocument()
  })

  it('closes help menu when onClose is called', () => {
    render(<SidebarCommonFooter />)

    fireEvent.click(screen.getByTestId('list-item-need-help'))
    expect(screen.getByTestId('help-menu')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('help-menu'))
    expect(screen.queryByTestId('help-menu')).not.toBeInTheDocument()
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
