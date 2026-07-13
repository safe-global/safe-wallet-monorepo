import { render, screen, fireEvent } from '@/tests/test-utils'
import StakingPromoBanner from './index'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))
import { trackEvent } from '@/services/analytics'

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const SAFE = 'eth:0x0000000000000000000000000000000000000001'

describe('StakingPromoBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the title, description, learn more link and CTA', () => {
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { query: { safe: SAFE } } })

    expect(screen.getByText('SAFE staking is now live')).toBeInTheDocument()
    expect(screen.getByText(/Stake SAFE tokens now and get rewards on deposit/i)).toBeInTheDocument()
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

  it('navigates to the staking route and tracks the CTA click', () => {
    const push = jest.fn(() => Promise.resolve(true))
    render(<StakingPromoBanner onDismiss={jest.fn()} />, { routerProps: { push, query: { safe: SAFE } } })

    fireEvent.click(screen.getByRole('button', { name: 'Stake now' }))

    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.stake, query: { safe: SAFE } })
    expect(mockTrackEvent.mock.calls.some((call) => call[0] === OVERVIEW_EVENTS.OPEN_STAKING_WIDGET)).toBe(true)
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
