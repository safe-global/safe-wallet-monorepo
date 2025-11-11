import { render, screen } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import HnSignupFlow from './HnSignupFlow'
import { setFormCompleted } from '@/features/hypernative/store/hnStateSlice'
import * as storeHooks from '@/store'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'

jest.mock('@/features/hypernative/components/HnSignupFlow/HnModal', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="hn-modal">{children}</div> : null,
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
    onSubmit: () => void
  }) => (
    <div data-testid="hn-signup-form">
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onSubmit}>Submit Form</button>
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

    // Mock HubSpot configuration
    process.env.NEXT_PUBLIC_HUBSPOT_CONFIG = JSON.stringify({
      portalId: 'test-portal',
      formId: 'test-form',
      region: 'eu1',
    })
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_CONFIG
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
    })

    it('should navigate to step 1 when Get Started is clicked', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.queryByTestId('hn-signup-intro')).not.toBeInTheDocument()
      expect(screen.getByTestId('hn-signup-form')).toBeInTheDocument()
    })

    it('should navigate back to step 0 when Cancel is clicked on form', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to step 1
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      expect(screen.getByTestId('hn-signup-form')).toBeInTheDocument()

      // Navigate back to step 0
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(screen.getByTestId('hn-signup-intro')).toBeInTheDocument()
      expect(screen.queryByTestId('hn-signup-form')).not.toBeInTheDocument()
    })
  })

  describe('Form submission', () => {
    it('should dispatch setFormCompleted action when form is submitted', async () => {
      const user = userEvent.setup()
      render(<HnSignupFlow open={true} onClose={mockOnClose} />)

      // Navigate to step 1
      const getStartedButton = screen.getByText('Get Started')
      await user.click(getStartedButton)

      // Submit the form
      const submitButton = screen.getByText('Submit Form')
      await user.click(submitButton)

      expect(mockDispatch).toHaveBeenCalledWith(
        setFormCompleted({
          chainId: '1',
          safeAddress: '0x123',
          completed: true,
        }),
      )
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

      // Navigate to step 1 and submit
      await user.click(screen.getByText('Get Started'))
      await user.click(screen.getByText('Submit Form'))

      expect(mockDispatch).toHaveBeenCalledWith(
        setFormCompleted({
          chainId: '137',
          safeAddress: '0xABC',
          completed: true,
        }),
      )
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

      // Form should be rendered (config is valid)
      expect(screen.getByTestId('hn-signup-form')).toBeInTheDocument()
    })
  })
})
