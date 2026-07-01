import { render, screen, fireEvent } from '@testing-library/react'
import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { GetFlatPricingBanner } from '../GetFlatPricingBanner'

const mockSetDismissed = jest.fn()
let mockDismissed: boolean | undefined = undefined
let mockIsBillingVisible: boolean | undefined = true
let mockSpaceId: string | null = 'space-1'
const mockTrackEvent = jest.fn()

jest.mock('@/services/local-storage/useLocalStorage', () => jest.fn(() => [mockDismissed, mockSetDismissed]))
jest.mock('../../../../hooks/useIsBillingVisible', () => ({ __esModule: true, default: () => mockIsBillingVisible }))
jest.mock('../../../../hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockSpaceId }))

jest.mock('@/services/analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, onClick, children }: { href: unknown; onClick?: () => void; children: ReactNode }) => {
    const pathname = typeof href === 'object' && href ? (href as { pathname: string }).pathname : String(href)
    const query = typeof href === 'object' && href ? (href as { query?: { spaceId?: string } }).query : undefined
    const url = query?.spaceId ? `${pathname}?spaceId=${query.spaceId}` : pathname
    return (
      <a href={url} onClick={onClick}>
        {children}
      </a>
    )
  },
}))

jest.mock('@/components/ui/sidebar', () => ({
  SidebarMenuItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, render: renderProp }: { children: ReactNode; render?: ReactElement }) =>
    renderProp ? cloneElement(renderProp, {}, children) : <button>{children}</button>,
}))

describe('GetFlatPricingBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDismissed = undefined
    mockIsBillingVisible = true
    mockSpaceId = 'space-1'
  })

  it('renders title, subtitle and CTA when billing is visible and not dismissed', () => {
    render(<GetFlatPricingBanner />)

    expect(screen.getByTestId('pricing-cta-sidebar')).toBeInTheDocument()
    expect(screen.getByText('Get flat pricing')).toBeInTheDocument()
    expect(screen.getByText('Upgrade to a plan with included fee-free volume.')).toBeInTheDocument()
  })

  it('links "Compare plans" to the billing page with the current space and tracks the click', () => {
    render(<GetFlatPricingBanner />)

    const link = screen.getByRole('link', { name: /Compare plans/i })
    expect(link).toHaveAttribute('href', '/spaces/billing?spaceId=space-1')

    fireEvent.click(link)
    expect(mockTrackEvent).toHaveBeenCalledWith({ action: 'Compare plans clicked', category: 'spaces' })
  })

  it('links to billing without a query when there is no space', () => {
    mockSpaceId = null
    render(<GetFlatPricingBanner />)

    expect(screen.getByRole('link', { name: /Compare plans/i })).toHaveAttribute('href', '/spaces/billing')
  })

  it('dismisses permanently when the ✕ is clicked', () => {
    render(<GetFlatPricingBanner />)

    fireEvent.click(screen.getByTestId('pricing-cta-dismiss'))
    expect(mockSetDismissed).toHaveBeenCalledWith(true)
  })

  it('renders nothing when dismissed', () => {
    mockDismissed = true
    render(<GetFlatPricingBanner />)

    expect(screen.queryByTestId('pricing-cta-sidebar')).not.toBeInTheDocument()
  })

  it('renders nothing when billing is not visible', () => {
    mockIsBillingVisible = false
    render(<GetFlatPricingBanner />)

    expect(screen.queryByTestId('pricing-cta-sidebar')).not.toBeInTheDocument()
  })

  it('renders nothing while chains are still loading (undefined)', () => {
    mockIsBillingVisible = undefined
    render(<GetFlatPricingBanner />)

    expect(screen.queryByTestId('pricing-cta-sidebar')).not.toBeInTheDocument()
  })
})
