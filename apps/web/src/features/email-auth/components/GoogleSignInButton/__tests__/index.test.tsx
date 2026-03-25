import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { OidcConnection } from '../../../hooks/useEmailLogin'
import GoogleSignInButton from '../index'

const mockLoginWithRedirect = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  EventType: { META: 'meta' },
}))

jest.mock('../../../hooks/useEmailLogin', () => {
  const original = jest.requireActual('../../../hooks/useEmailLogin')
  return {
    ...original,
    useEmailLogin: () => ({ loginWithRedirect: mockLoginWithRedirect }),
  }
})

const mockUseHasFeature = jest.fn(() => true)

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
  })

  it('should render nothing when feature flag is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = render(<GoogleSignInButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should render the sign in button', () => {
    render(<GoogleSignInButton />)

    expect(screen.getByTestId('google-login-btn')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('should track analytics event on click', () => {
    render(<GoogleSignInButton />)

    fireEvent.click(screen.getByTestId('google-login-btn'))

    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.GOOGLE_SIGN_IN)
  })

  it('should call loginWithRedirect with google-oauth2 connection on click', () => {
    render(<GoogleSignInButton />)

    fireEvent.click(screen.getByTestId('google-login-btn'))

    expect(mockLoginWithRedirect).toHaveBeenCalledWith(OidcConnection.GOOGLE)
  })
})
