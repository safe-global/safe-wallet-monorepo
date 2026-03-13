import { render, fireEvent } from '@/tests/test-utils'
import EmailSignInButton from '../index'
import * as analytics from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

const mockLoginWithRedirect = jest.fn()

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: mockLoginWithRedirect,
  }),
}))

let mockIsAuth0Configured = true
jest.mock('../../../config/auth0', () => ({
  get isAuth0Configured() {
    return mockIsAuth0Configured
  },
}))

let mockUseHasFeature = true
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature,
}))

describe('EmailSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuth0Configured = true
    mockUseHasFeature = true
  })

  it('should render the button when feature is enabled and Auth0 is configured', () => {
    const { getByTestId } = render(<EmailSignInButton />)

    expect(getByTestId('email-login-btn')).toBeInTheDocument()
    expect(getByTestId('email-login-btn')).toHaveTextContent('Sign in with email')
  })

  it('should return null when feature flag is disabled', () => {
    mockUseHasFeature = false

    const { container } = render(<EmailSignInButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should return null when Auth0 is not configured', () => {
    mockIsAuth0Configured = false

    const { container } = render(<EmailSignInButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should return null when both feature flag and Auth0 are disabled', () => {
    mockUseHasFeature = false
    mockIsAuth0Configured = false

    const { container } = render(<EmailSignInButton />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should call loginWithRedirect and track event on click', () => {
    const trackEventSpy = jest.spyOn(analytics, 'trackEvent').mockImplementation()

    const { getByTestId } = render(<EmailSignInButton />)
    fireEvent.click(getByTestId('email-login-btn'))

    expect(trackEventSpy).toHaveBeenCalledWith(SPACE_EVENTS.EMAIL_SIGN_IN)
    expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1)
  })
})
