import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import EmailSignInButton from '../index'

const mockLoginWithRedirect = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  EventType: { META: 'meta' },
}))

jest.mock('../../../hooks/useEmailLogin', () => ({
  useEmailLogin: () => ({ loginWithRedirect: mockLoginWithRedirect }),
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => true,
}))

describe('EmailSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the sign in button', () => {
    render(<EmailSignInButton />)

    expect(screen.getByTestId('email-login-btn')).toBeInTheDocument()
    expect(screen.getByText('Sign in with email')).toBeInTheDocument()
  })

  it('should track analytics event on click', () => {
    render(<EmailSignInButton />)

    fireEvent.click(screen.getByTestId('email-login-btn'))

    expect(trackEvent).toHaveBeenCalledWith(SPACE_EVENTS.EMAIL_SIGN_IN)
  })

  it('should call loginWithRedirect on click', () => {
    render(<EmailSignInButton />)

    fireEvent.click(screen.getByTestId('email-login-btn'))

    expect(mockLoginWithRedirect).toHaveBeenCalled()
  })
})
