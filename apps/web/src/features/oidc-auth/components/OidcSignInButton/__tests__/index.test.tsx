import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { OidcConnection } from '../../../constants'
import OidcSignInButton from '../index'

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

const testEvent = { action: 'Test action', category: 'test' }
const TestIcon = () => <span data-testid="test-icon" />

const renderButton = (variant?: 'primary' | 'secondary') =>
  render(
    <OidcSignInButton
      connection={OidcConnection.EMAIL}
      label="Continue with test"
      icon={<TestIcon />}
      analyticsEvent={testEvent}
      testId="test-btn"
      variant={variant}
    />,
  )

describe('OidcSignInButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
  })

  it('should render nothing when feature flag is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = renderButton()

    expect(container).toBeEmptyDOMElement()
  })

  it('should render button with label and icon', () => {
    renderButton()

    expect(screen.getByTestId('test-btn')).toBeInTheDocument()
    expect(screen.getByText('Continue with test')).toBeInTheDocument()
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should track analytics event on click', () => {
    renderButton()

    fireEvent.click(screen.getByTestId('test-btn'))

    expect(trackEvent).toHaveBeenCalledWith(testEvent)
  })

  it('should call loginWithRedirect with the given connection on click', () => {
    renderButton()

    fireEvent.click(screen.getByTestId('test-btn'))

    expect(mockLoginWithRedirect).toHaveBeenCalledWith(OidcConnection.EMAIL)
  })

  // The primary variant pins to a theme-agnostic dark surface in light mode
  // (and a light surface in dark mode) so the Google "G" doesn't collide
  // with shadcn's bg-primary token flipping to Safe-green in dark mode.
  it('applies the primary-variant override class when variant="primary"', () => {
    renderButton('primary')

    expect(screen.getByTestId('test-btn').className).toContain('bg-[#171717]')
  })

  it('does not apply the primary-variant override class when variant defaults to secondary', () => {
    renderButton()

    expect(screen.getByTestId('test-btn').className).not.toContain('bg-[#171717]')
  })
})
