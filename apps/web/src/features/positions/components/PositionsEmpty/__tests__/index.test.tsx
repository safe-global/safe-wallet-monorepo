import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixPanelEventParams } from '@/services/analytics/mixpanel-events'
import PositionsEmpty from '../index'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  MixPanelEventParams: {
    ENTRY_POINT: 'Entry Point',
  },
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('PositionsEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render empty positions message', () => {
    render(<PositionsEmpty />)

    expect(screen.getByText('You have no active DeFi positions yet')).toBeInTheDocument()
    expect(screen.getByText('Explore Earn')).toBeInTheDocument()
  })

  it('should track EMPTY_POSITIONS_EXPLORE_CLICKED event when button is clicked with dashboard entry point', () => {
    render(<PositionsEmpty entryPoint="Dashboard" />)

    const exploreButton = screen.getByText('Explore Earn')
    fireEvent.click(exploreButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED, {
      [MixPanelEventParams.ENTRY_POINT]: 'Dashboard',
    })
  })

  it('should track EMPTY_POSITIONS_EXPLORE_CLICKED event when button is clicked with positions entry point', () => {
    render(<PositionsEmpty entryPoint="Positions" />)

    const exploreButton = screen.getByText('Explore Earn')
    fireEvent.click(exploreButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED, {
      [MixPanelEventParams.ENTRY_POINT]: 'Positions',
    })
  })

  it('should default to dashboard entry point when no prop is provided', () => {
    render(<PositionsEmpty />)

    const exploreButton = screen.getByText('Explore Earn')
    fireEvent.click(exploreButton)

    expect(mockTrackEvent).toHaveBeenCalledWith(POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED, {
      [MixPanelEventParams.ENTRY_POINT]: 'Dashboard',
    })
  })
})
