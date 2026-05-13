import { render, screen } from '@testing-library/react'
import { cloneElement, isValidElement, type ReactNode } from 'react'
import { SidebarIndexingStatus } from '../SidebarIndexingStatus'

const mockUseQuery = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/chains', () => ({
  useChainsGetIndexingStatusV1Query: (...args: unknown[]) => mockUseQuery(...args),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

jest.mock('@/config/constants', () => ({
  STATUS_PAGE_URL: 'https://status.safe.global',
}))

jest.mock('@/public/images/sidebar/status.svg', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => <svg data-testid="status-icon" className={className} />,
}))

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render: renderProp, children }: { render: React.ReactElement; children: ReactNode }) =>
    isValidElement(renderProp) ? cloneElement(renderProp, undefined, children) : <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

const NOW = new Date('2026-04-27T12:00:00Z').getTime()

describe('SidebarIndexingStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders nothing while loading', () => {
    mockUseQuery.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    const { container } = render(<SidebarIndexingStatus />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing on error', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true, data: undefined })
    const { container } = render(<SidebarIndexingStatus />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when data is missing', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: false, data: undefined })
    const { container } = render(<SidebarIndexingStatus />)
    expect(container).toBeEmptyDOMElement()
  })

  it('marks status as synced when data.synced is true', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { synced: true, lastSync: NOW - 1000 },
    })
    render(<SidebarIndexingStatus />)
    const link = screen.getByTestId('index-status')
    expect(link).toHaveAttribute('data-status', 'synced')
    expect(link).toHaveAttribute('href', 'https://status.safe.global')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('marks status as slow when not synced and lastSync is older than 5 minutes', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { synced: false, lastSync: NOW - 1000 * 60 * 6 },
    })
    render(<SidebarIndexingStatus />)
    expect(screen.getByTestId('index-status')).toHaveAttribute('data-status', 'slow')
  })

  it('marks status as outOfSync when not synced but lastSync is recent', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { synced: false, lastSync: NOW - 1000 * 30 },
    })
    render(<SidebarIndexingStatus />)
    expect(screen.getByTestId('index-status')).toHaveAttribute('data-status', 'outOfSync')
  })

  it('renders the status icon', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { synced: true, lastSync: NOW - 1000 },
    })
    render(<SidebarIndexingStatus />)
    expect(screen.getByTestId('status-icon')).toBeInTheDocument()
  })
})
