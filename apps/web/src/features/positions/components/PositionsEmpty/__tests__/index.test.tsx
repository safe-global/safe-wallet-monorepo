import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { POSITIONS_EVENTS } from '@/services/analytics/events/positions'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PositionsEmpty from '../index'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  MixpanelEventParams: {
    ENTRY_POINT: 'Entry Point',
  },
}))

jest.mock('@/features/earn/hooks/useIsEarnFeatureEnabled', () => ({
  __esModule: true,
  default: jest.fn(),
  useIsEarnPromoEnabled: jest.fn(() => true),
}))

import { useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
const mockUseIsEarnFeatureEnabled = useIsEarnPromoEnabled as jest.MockedFunction<typeof useIsEarnPromoEnabled>

describe('PositionsEmpty', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when earn feature is enabled', () => {
    beforeEach(() => {
      mockUseIsEarnFeatureEnabled.mockReturnValue(true)
    })

    it('should render empty positions message with explore earn button', () => {
      render(<PositionsEmpty />)

      expect(screen.getByText('You have no active DeFi positions yet')).toBeInTheDocument()
      expect(screen.getByText('Explore Earn')).toBeInTheDocument()
    })

    it('should track EMPTY_POSITIONS_EXPLORE_CLICKED event when button is clicked with dashboard entry point', () => {
      render(<PositionsEmpty entryPoint="Dashboard" />)

      const exploreButton = screen.getByText('Explore Earn')
      fireEvent.click(exploreButton)

      expect(mockTrackEvent).toHaveBeenCalledWith(POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED, {
        [MixpanelEventParams.ENTRY_POINT]: 'Dashboard',
      })
    })

    it('should track EMPTY_POSITIONS_EXPLORE_CLICKED event when button is clicked with positions entry point', () => {
      render(<PositionsEmpty entryPoint="Positions" />)

      const exploreButton = screen.getByText('Explore Earn')
      fireEvent.click(exploreButton)

      expect(mockTrackEvent).toHaveBeenCalledWith(POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED, {
        [MixpanelEventParams.ENTRY_POINT]: 'Positions',
      })
    })

    it('should default to dashboard entry point when no prop is provided', () => {
      render(<PositionsEmpty />)

      const exploreButton = screen.getByText('Explore Earn')
      fireEvent.click(exploreButton)

      expect(mockTrackEvent).toHaveBeenCalledWith(POSITIONS_EVENTS.EMPTY_POSITIONS_EXPLORE_CLICKED, {
        [MixpanelEventParams.ENTRY_POINT]: 'Dashboard',
      })
    })
  })

  describe('when earn feature is disabled', () => {
    beforeEach(() => {
      mockUseIsEarnFeatureEnabled.mockReturnValue(false)
    })

    it('should render empty positions message without explore earn button', () => {
      render(<PositionsEmpty />)

      expect(screen.getByText('You have no active DeFi positions yet')).toBeInTheDocument()
      expect(screen.queryByText('Explore Earn')).not.toBeInTheDocument()
    })

    it('should not call trackEvent when earn feature is disabled', () => {
      render(<PositionsEmpty />)

      // No button to click, so tracking should not be called
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })
})
