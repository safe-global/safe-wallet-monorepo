import { render, screen, fireEvent } from '@/tests/test-utils'
import StakingPromoBanner from './index'
import { OVERVIEW_EVENTS } from '@/services/analytics'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))
import { trackEvent } from '@/services/analytics'

const mockOpenSafenetStakingApp = jest.fn()
let mockIsNavigating = false
jest.mock('@/hooks/useOpenSafenetStakingApp', () => ({
  useOpenSafenetStakingApp: () => ({
    openSafenetStakingApp: mockOpenSafenetStakingApp,
    isNavigating: mockIsNavigating,
  }),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const SAFE = 'eth:0x0000000000000000000000000000000000000001'

describe('StakingPromoBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsNavigating = false
  })

  it('renders the title, description, learn more link and CTA', () => {
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { query: { safe: SAFE } } })

    expect(screen.getByText('Stake SAFE tokens and earn up to ~15% APR')).toBeInTheDocument()
    expect(screen.getByText(/Earn by staking your SAFE tokens, currently rewarded up to 15%/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stake now' })).toBeInTheDocument()

    const learnMore = screen.getByRole('link', { name: 'Learn more' })
    expect(learnMore).toHaveAttribute(
      'href',
      'https://forum.safefoundation.org/t/sep-55-phase-2-fund-safenet-beta-for-safe-token-utility/6967',
    )
    expect(learnMore).toHaveAttribute('target', '_blank')
  })

  it('fires the show event on mount', () => {
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { query: { safe: SAFE } } })

    expect(mockTrackEvent).toHaveBeenCalledWith(OVERVIEW_EVENTS.SHOW_STAKING_BANNER)
  })

  it('opens the native SAFE staking app and tracks the CTA click', () => {
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { query: { safe: SAFE } } })

    fireEvent.click(screen.getByRole('button', { name: 'Stake now' }))

    expect(mockOpenSafenetStakingApp).toHaveBeenCalled()
    expect(mockTrackEvent.mock.calls.some((call) => call[0] === OVERVIEW_EVENTS.OPEN_STAKING_WIDGET)).toBe(true)
  })

  it('shows a spinner in the CTA while navigating to the staking app', () => {
    mockIsNavigating = true
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { query: { safe: SAFE } } })

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    // The CTA stays enabled and visible while loading (re-clicks are guarded inside the hook)
    expect(screen.getByRole('button', { name: 'Stake now' })).toBeEnabled()
  })

  it('tracks the learn more click', () => {
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { query: { safe: SAFE } } })

    fireEvent.click(screen.getByRole('link', { name: 'Learn more' }))

    expect(mockTrackEvent).toHaveBeenCalledWith(OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER)
  })

  it('calls onDismiss and tracks the hide event when dismissed', () => {
    const onDismiss = jest.fn()
    render(<StakingPromoBanner onDismiss={onDismiss} />, { routerProps: { query: { safe: SAFE } } })

    fireEvent.click(screen.getByRole('button', { name: 'close' }))

    expect(onDismiss).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledWith(OVERVIEW_EVENTS.HIDE_STAKING_BANNER)
  })
})
