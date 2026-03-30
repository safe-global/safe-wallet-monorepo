import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OidcConnection } from '../../../constants'
import EmailSignInButton from '../index'

const mockLoginWithRedirect = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  EventType: { META: 'meta' },
}))

jest.mock('../../../hooks/useOidcLogin', () => ({
  useOidcLogin: () => ({ loginWithRedirect: mockLoginWithRedirect }),
}))

const mockUseHasFeature = jest.fn(() => true)

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

describe('EmailSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
  })

  it('should render nothing when feature flag is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = render(<EmailSignInButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should render the sign in button', () => {
    render(<EmailSignInButton />)

    expect(screen.getByTestId('email-login-btn')).toBeInTheDocument()
    expect(screen.getByText('Continue with email')).toBeInTheDocument()
  })

  it('should track analytics event on click', () => {
    render(<EmailSignInButton />)

    fireEvent.click(screen.getByTestId('email-login-btn'))

    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.EMAIL_SIGN_IN)
  })

  it('should call loginWithRedirect with email connection on click', () => {
    render(<EmailSignInButton />)

    fireEvent.click(screen.getByTestId('email-login-btn'))

    expect(mockLoginWithRedirect).toHaveBeenCalledWith(OidcConnection.EMAIL)
  })
})
