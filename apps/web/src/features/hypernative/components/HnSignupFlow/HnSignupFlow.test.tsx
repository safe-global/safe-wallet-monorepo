import { render, screen } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import HnSignupFlow from './HnSignupFlow'
import { setFormCompleted } from '@/features/hypernative/store/hnStateSlice'
import * as storeHooks from '@/store'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useChainsHook from '@/hooks/useChains'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

jest.mock('@/features/hypernative/components/HnSignupFlow/HnModal', () => ({
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

jest.mock('@/features/hypernative/components/HnSignupFlow/HnSignupIntro', () => ({
  __esModule: true,
  default: ({ onGetStarted, onClose }: { onGetStarted: () => void; onClose: () => void }) => (
    <div data-testid="hn-signup-intro">
      <button onClick={onGetStarted}>Get Started</button>
      <button onClick={onClose}>Close Intro</button>
    </div>
  ),
}))

jest.mock('@/features/hypernative/components/HnSignupFlow/HnSignupForm', () => ({
  __esModule: true,
  default: ({
    onCancel,
    onSubmit,
  }: {
    portalId: string
    formId: string
    region: string
    onCancel: () => void
    onSubmit: (region: string) => void
  }) => (
    <div data-testid="hn-signup-form">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={() => onSubmit('EMEA')}>Submit</button>
    </div>
  ),
}))

jest.mock('@/features/hypernative/components/HnSignupFlow/HnCalendlyStep', () => ({
  __esModule: true,
  default: ({ calendlyUrl }: { calendlyUrl: string }) => (
    <div data-testid="hn-calendly-step">
      <div>Calendly: {calendlyUrl}</div>
    </div>
  ),
}))

describe('HnSignupFlow', () => {
  const mockDispatch = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(storeHooks, 'useAppDispatch').mockReturnValue(mockDispatch)
    jest.spyOn(useChainIdHook, 'default').mockReturnValue('1')
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safeAddress: '0x123',
      safe: {} as any,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
    jest.spyOn(useChainsHook, 'useCurrentChain').mockReturnValue(undefined)

    process.env.NEXT_PUBLIC_HUBSPOT_CONFIG = JSON.stringify({
      portalId: 'test-portal',
      formId: 'test-form',
      region: 'eu1',
    })
    process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY = JSON.stringify({
      AMERICAS: 'https://calendly.com/americas',
      EMEA: 'https://calendly.com/emea',
    })
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_CONFIG
    delete process.env.NEXT_PUBLIC_HYPERNATIVE_CALENDLY
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
      expect(screen.queryByTestId('hn-signup-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hn-calendly-step')).not.toBeInTheDocument()
    })

    it('should navigate to step 1 when Get Started is clicked', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.queryByTestId('hn-signup-intro')).not.toBeInTheDocument()
      expect(screen.getByTestId('hn-signup-form')).toBeInTheDocument()
    })

    it('should navigate to Calendly step after form submit', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      await user.click(screen.getByText('Get Started'))
      await user.click(screen.getByText('Submit'))

      expect(screen.queryByTestId('hn-signup-form')).not.toBeInTheDocument()
      expect(screen.getByTestId('hn-calendly-step')).toBeInTheDocument()
    })

    it('should show Calendly URL based on selected region', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      await user.click(screen.getByText('Get Started'))
      await user.click(screen.getByText('Submit')) // submits with 'EMEA'

      expect(screen.getByText('Calendly: https://calendly.com/emea')).toBeInTheDocument()
    })

    describe('Redux dispatch', () => {
      it('should dispatch setFormCompleted on close after form submitted', async () => {
        const user = userEvent.setup()
        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        await user.click(screen.getByText('Get Started'))
        await user.click(screen.getByText('Submit'))
        await user.click(screen.getByLabelText('close'))

        expect(mockDispatch).toHaveBeenCalledWith(
          setFormCompleted({ chainId: '1', safeAddress: '0x123', completed: true }),
        )
        expect(mockOnClose).toHaveBeenCalled()
      })

      it('should not dispatch setFormCompleted if form was not submitted', async () => {
        const user = userEvent.setup()
        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        await user.click(screen.getByText('Get Started'))
        await user.click(screen.getByLabelText('close'))

        expect(mockDispatch).not.toHaveBeenCalled()
        expect(mockOnClose).toHaveBeenCalled()
      })

      it('should dispatch with correct chainId and safeAddress', async () => {
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

        await user.click(screen.getByText('Get Started'))
        await user.click(screen.getByText('Submit'))

        const closeButton = screen.getByLabelText('close')
        await user.click(closeButton)

        expect(mockDispatch).toHaveBeenCalledWith(
          setFormCompleted({ chainId: '137', safeAddress: '0xABC', completed: true }),
        )
      })
    })

    describe('Analytics events', () => {
      it('should not fire GUARDIAN_FORM_SUBMITTED on HubSpot form navigation (fired inside HubSpotForm itself)', async () => {
        const user = userEvent.setup()
        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        await user.click(screen.getByText('Get Started'))

        // GUARDIAN_FORM_SUBMITTED is fired inside HubSpotForm's onFormSubmitted callback,
        // not in HnSignupFlow directly
        expect(mockTrackEvent).not.toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_FORM_SUBMITTED)
      })

      it('should not fire tracking events when closing without form submission', async () => {
        const user = userEvent.setup()
        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        await user.click(screen.getByText('Get Started'))
        await user.click(screen.getByLabelText('close'))

        expect(mockTrackEvent).not.toHaveBeenCalled()
      })
    })

    describe('HubSpot configuration', () => {
      it('should show error message when HubSpot config is missing', async () => {
        const user = userEvent.setup()
        delete process.env.NEXT_PUBLIC_HUBSPOT_CONFIG

        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        // Navigate to step 1
        const getStartedButton = screen.getByText('Get Started')
        await user.click(getStartedButton)

        expect(screen.getByText('HubSpot configuration is missing or invalid.')).toBeInTheDocument()
        expect(screen.queryByTestId('hn-signup-form')).not.toBeInTheDocument()
      })

      it('should show error message when HubSpot config is invalid JSON', async () => {
        const user = userEvent.setup()
        process.env.NEXT_PUBLIC_HUBSPOT_CONFIG = 'invalid-json'

        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        // Navigate to step 1
        const getStartedButton = screen.getByText('Get Started')
        await user.click(getStartedButton)

        expect(screen.getByText('HubSpot configuration is missing or invalid.')).toBeInTheDocument()
        expect(screen.queryByTestId('hn-signup-form')).not.toBeInTheDocument()
      })

      it('should pass HubSpot config to HnSignupForm', async () => {
        const user = userEvent.setup()
        render(<HnSignupFlow open={true} onClose={mockOnClose} />)

        // Navigate to step 1
        const getStartedButton = screen.getByText('Get Started')
        await user.click(getStartedButton)

        expect(screen.getByTestId('hn-signup-form')).toBeInTheDocument()
      })
    })
  })
})
