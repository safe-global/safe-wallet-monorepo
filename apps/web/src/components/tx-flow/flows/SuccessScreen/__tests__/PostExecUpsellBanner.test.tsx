import { render, screen, fireEvent } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import PostExecUpsellBanner from '../PostExecUpsellBanner'

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

describe('PostExecUpsellBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsBillingVisible = true
    mockSpaceId = 'space-1'
  })

  it('renders the fee value prop and Compare plans CTA when billing is visible', () => {
    render(<PostExecUpsellBanner />)

    const banner = screen.getByTestId('post-exec-upsell-banner')
    expect(screen.getByText('Get flat pricing')).toBeInTheDocument()
    expect(banner).toHaveTextContent('in fees for this transaction.')

    const link = screen.getByRole('link', { name: 'Compare plans' })
    expect(link).toHaveAttribute('href', '/spaces/billing?spaceId=space-1')

    fireEvent.click(link)
    expect(mockTrackEvent).toHaveBeenCalledWith({ action: 'Compare plans clicked', category: 'spaces' })
  })

  it('renders nothing when billing is not visible', () => {
    mockIsBillingVisible = false
    render(<PostExecUpsellBanner />)
    expect(screen.queryByTestId('post-exec-upsell-banner')).not.toBeInTheDocument()
  })
})
