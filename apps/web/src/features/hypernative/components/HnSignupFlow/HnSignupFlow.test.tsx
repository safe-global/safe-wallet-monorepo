import { render, screen } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import HnSignupFlow from './HnSignupFlow'
import { setFormCompleted } from '../../store/hnStateSlice'
import * as storeHooks from '@/store'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { trackEvent, HYPERNATIVE_EVENTS, MixpanelEventParams } from '@/services/analytics'

// Mock analytics
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

jest.mock('./HnModal', () => ({
  __esModule: true,
  default: ({ children, open, onClose }: { children: React.ReactNode; open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="hn-modal">
        <button aria-label="close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}))

jest.mock('./HnSignupIntro', () => ({
  __esModule: true,
  default: ({ onGetStarted, onClose }: { onGetStarted: () => void; onClose: () => void }) => (
    <div data-testid="hn-signup-intro">
      <button onClick={onGetStarted}>Get Started</button>
      <button onClick={onClose}>Close Intro</button>
    </div>
  ),
}))

jest.mock('./HnCalendlyStep', () => ({
  __esModule: true,
  default: ({ calendlyUrl, onBookingScheduled }: { calendlyUrl: string; onBookingScheduled?: () => void }) => (
    <div data-testid="hn-calendly-step">
      <div>Calendly: {calendlyUrl}</div>
      {onBookingScheduled && (
        <button
          data-testid="simulate-booking"
          onClick={() => {
            onBookingScheduled()
          }}
        >
          Simulate Booking
        </button>
      )}
    </div>
  ),
}))

describe('HnSignupFlow', () => {
  const mockDispatch = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockTrackEvent.mockClear()

    jest.spyOn(storeHooks, 'useAppDispatch').mockReturnValue(mockDispatch)
    jest.spyOn(useChainIdHook, 'default').mockReturnValue('1')
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: '0x123',
      safe: {} as any,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  describe('Modal behavior', () => {
    it('should render modal when open is true', () => {
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      expect(screen.getByTestId('hn-modal')).toBeInTheDocument()
    })

    it('should not render modal when open is false', () => {
      render(<HnSignupFlow open={false} onClose={mockOnClose} />)

      expect(screen.queryByTestId('hn-modal')).not.toBeInTheDocument()
    })

    it('should call onClose when modal is closed', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      const closeButton = screen.getByText('Close Intro')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Step navigation', () => {
    it('should show HnSignupIntro on step 0', () => {
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      expect(screen.getByTestId('hn-signup-intro')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-calendly-step')).not.toBeInTheDocument()
    })

    it('should navigate to Calendly step when Get Started is clicked', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.queryByTestId('hn-signup-intro')).not.toBeInTheDocument()
      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()
    })
  })

  describe('Form completion', () => {
    it('should dispatch setFormCompleted action when a booking is scheduled', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()

      // Simulate booking being scheduled
      const simulateBookingButton = screen.getByTestId('simulate-booking')
      await user.click(simulateBookingButton)

      // Should dispatch setFormCompleted when booking is scheduled
      expect(mockDispatch).toHaveBeenCalledWith(
        setFormCompleted({
          chainId: '1',
          safeAddress: '0x123',
          completed: true,
        }),
      )
    })

    it('should track GUARDIAN_FORM_SUBMITTED event when a booking is scheduled', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()

      // Simulate booking being scheduled
      const simulateBookingButton = screen.getByTestId('simulate-booking')
      await user.click(simulateBookingButton)

      // Should track GUARDIAN_FORM_SUBMITTED event with correct parameters
      expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_FORM_SUBMITTED, {
        [MixpanelEventParams.BLOCKCHAIN_NETWORK]: '1',
        [MixpanelEventParams.SAFE_ADDRESS]: '0x123',
      })
    })

    it('should track GUARDIAN_FORM_SUBMITTED event with correct chainId and safeAddress', async () => {
      const user = userEvent.setup()
      jest.spyOn(useChainIdHook, 'default').mockReturnValue('137')
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: '0xABC',
        safe: {} as any,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      await user.click(screen.getByText('Get Started'))

      // Simulate booking being scheduled
      const simulateBookingButton = screen.getByTestId('simulate-booking')
      await user.click(simulateBookingButton)

      // Should track event with correct chainId and safeAddress
      expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_FORM_SUBMITTED, {
        [MixpanelEventParams.BLOCKCHAIN_NETWORK]: '137',
        [MixpanelEventParams.SAFE_ADDRESS]: '0xABC',
      })
    })

    it('should not track GUARDIAN_FORM_SUBMITTED event if booking is not scheduled', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()

      // Close the modal without scheduling a booking
      const closeButton = screen.getByLabelText('close')
      await user.click(closeButton)

      // Should not track event when closing without booking
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should dispatch with correct chainId and safeAddress when booking is scheduled', async () => {
      const user = userEvent.setup()
      jest.spyOn(useChainIdHook, 'default').mockReturnValue('137')
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: '0xABC',
        safe: {} as any,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      await user.click(screen.getByText('Get Started'))

      // Simulate booking being scheduled
      const simulateBookingButton = screen.getByTestId('simulate-booking')
      await user.click(simulateBookingButton)

      expect(mockDispatch).toHaveBeenCalledWith(
        setFormCompleted({
          chainId: '137',
          safeAddress: '0xABC',
          completed: true,
        }),
      )
    })

    it('should not dispatch setFormCompleted if modal is closed without booking', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()

      // Close the modal without scheduling a booking
      const closeButton = screen.getByLabelText('close')
      await user.click(closeButton)

      // Should not dispatch setFormCompleted when closing without booking
      expect(mockDispatch).not.toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not dispatch setFormCompleted if Calendly step was not reached', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Close the modal without navigating to Calendly
      const closeButton = screen.getByLabelText('close')
      await user.click(closeButton)

      // Should not dispatch setFormCompleted
      expect(mockDispatch).not.toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Calendly configuration', () => {
    it('should render Calendly step with hardcoded URL', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to Calendly step
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      // Calendly step should be rendered with hardcoded URL
      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()
      expect(screen.getByText(/Calendly: https:\/\/calendly\.com\/d\/ctgh-yrs-dnr/)).toBeInTheDocument()
    })
  })
})
