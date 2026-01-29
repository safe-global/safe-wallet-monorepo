import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import RefreshPositionsButton from '../index'
import * as analytics from '@/services/analytics'
import * as useRefetchBalances from '@/hooks/useRefetchBalances'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/positions', () => ({
  POSITIONS_EVENTS: {
    POSITIONS_REFRESH_CLICKED: { action: 'Refresh positions clicked', category: 'positions' },
  },
}))

jest.mock('@/services/analytics/mixpanel-events', () => ({
  MixpanelEventParams: {
    ENTRY_POINT: 'entry_point',
  },
}))

describe('RefreshPositionsButton', () => {
  const mockRefetch = jest.fn().mockResolvedValue({})

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useRefetchBalances, 'useRefetchBalances').mockReturnValue({
      refetch: mockRefetch,
      refetchPositions: mockRefetch,
      shouldUsePortfolioEndpoint: false,
      fulfilledTimeStamp: undefined,
      isFetching: false,
    })
  })

  describe('icon-only mode', () => {
    it('should render icon button when no label is provided', () => {
      render(<RefreshPositionsButton />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(screen.queryByText('Refresh')).not.toBeInTheDocument()
    })

    it('should show tooltip on hover', async () => {
      render(<RefreshPositionsButton />)

      const button = screen.getByRole('button')
      fireEvent.mouseOver(button)

      await waitFor(() => {
        expect(screen.getByText('Refresh positions data')).toBeInTheDocument()
      })
    })

    it('should show portfolio tooltip when portfolio endpoint is enabled', async () => {
      jest.spyOn(useRefetchBalances, 'useRefetchBalances').mockReturnValue({
        refetch: mockRefetch,
        refetchPositions: mockRefetch,
        shouldUsePortfolioEndpoint: true,
        fulfilledTimeStamp: undefined,
        isFetching: false,
      })

      render(<RefreshPositionsButton />)

      const button = screen.getByRole('button')
      fireEvent.mouseOver(button)

      await waitFor(() => {
        expect(screen.getByText('Refresh portfolio data')).toBeInTheDocument()
      })
    })
  })

  describe('button with label mode', () => {
    it('should render button with label when provided', () => {
      render(<RefreshPositionsButton label="Refresh positions" />)

      expect(screen.getByText('Refresh positions')).toBeInTheDocument()
    })

    it('should use custom tooltip when provided', async () => {
      render(<RefreshPositionsButton label="Refresh" tooltip="Custom tooltip text" />)

      const button = screen.getByRole('button')
      fireEvent.mouseOver(button)

      await waitFor(() => {
        expect(screen.getByText('Custom tooltip text')).toBeInTheDocument()
      })
    })
  })

  describe('click behavior', () => {
    it('should call refetch on click', async () => {
      render(<RefreshPositionsButton />)

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    it('should track analytics event on click', async () => {
      render(<RefreshPositionsButton entryPoint="Dashboard" />)

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(analytics.trackEvent).toHaveBeenCalledWith(
          { action: 'Refresh positions clicked', category: 'positions' },
          { entry_point: 'Dashboard' },
        )
      })
    })

    it('should use default entry point when not provided', async () => {
      render(<RefreshPositionsButton />)

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(analytics.trackEvent).toHaveBeenCalledWith(expect.anything(), { entry_point: 'Positions' })
      })
    })
  })

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<RefreshPositionsButton disabled />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should not call refetch when disabled', async () => {
      render(<RefreshPositionsButton disabled />)

      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockRefetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('size variants', () => {
    it('should render small size by default', () => {
      render(<RefreshPositionsButton />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('MuiIconButton-sizeSmall')
    })

    it('should render medium size when specified', () => {
      render(<RefreshPositionsButton size="medium" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('MuiIconButton-sizeMedium')
    })

    it('should render button with label at specified size', () => {
      render(<RefreshPositionsButton label="Refresh" size="large" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('MuiButton-sizeLarge')
    })
  })
})
