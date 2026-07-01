import { render, screen, fireEvent } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import HistoryUpsellBanner from '../HistoryUpsellBanner'

let mockIsBillingVisible: boolean | undefined = true
let mockSpaceId: string | null = 'space-1'
const mockTrackEvent = jest.fn()

jest.mock('@/features/spaces', () => ({
  useIsBillingVisible: () => mockIsBillingVisible,
  useCurrentSpaceId: () => mockSpaceId,
}))
jest.mock('@/services/analytics', () => ({ trackEvent: (...args: unknown[]) => mockTrackEvent(...args) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, onClick, children }: { href: string; onClick?: () => void; children: ReactNode }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('HistoryUpsellBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsBillingVisible = true
    mockSpaceId = 'space-1'
  })

  it('renders the static value prop and Explore plans CTA when billing is visible', () => {
    render(<HistoryUpsellBanner />)

    const banner = screen.getByTestId('history-upsell-banner')
    expect(screen.getByText('Get flat pricing')).toBeInTheDocument()
    expect(banner).toHaveTextContent('In the past 30 days')
    expect(banner).toHaveTextContent('transactions and spent')
    expect(banner).toHaveTextContent('in fees.')

    const link = screen.getByRole('link', { name: 'Explore plans' })
    expect(link).toHaveAttribute('href', '/spaces/billing?spaceId=space-1')

    fireEvent.click(link)
    expect(mockTrackEvent).toHaveBeenCalledWith({ action: 'Explore plans clicked', category: 'spaces' })
  })

  it('links to billing without a query when there is no space', () => {
    mockSpaceId = null
    render(<HistoryUpsellBanner />)
    expect(screen.getByRole('link', { name: 'Explore plans' })).toHaveAttribute('href', '/spaces/billing')
  })

  it('renders nothing when billing is not visible', () => {
    mockIsBillingVisible = false
    render(<HistoryUpsellBanner />)
    expect(screen.queryByTestId('history-upsell-banner')).not.toBeInTheDocument()
  })

  it('renders nothing while chains are still loading (undefined)', () => {
    mockIsBillingVisible = undefined
    render(<HistoryUpsellBanner />)
    expect(screen.queryByTestId('history-upsell-banner')).not.toBeInTheDocument()
  })
})
