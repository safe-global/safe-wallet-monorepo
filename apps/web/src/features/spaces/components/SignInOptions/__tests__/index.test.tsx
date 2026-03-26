import { render, screen } from '@/tests/test-utils'
import SignInOptions from '../index'

const mockAfterSignIn = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  EventType: { META: 'meta' },
}))

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: () => ({ signIn: jest.fn(), loading: false }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => null,
}))

const MockEmailSignInButton = () => <button data-testid="email-login-btn">Continue with email</button>
const MockGoogleSignInButton = () => <button data-testid="google-login-btn">Continue with Google</button>

const mockUseLoadFeature = jest.fn()

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => mockUseLoadFeature(),
  createFeatureHandle: () => ({}),
}))

const mockEmailAuthFeature = (isDisabled: boolean, isReady = !isDisabled) =>
  mockUseLoadFeature.mockReturnValue({
    EmailSignInButton: isDisabled ? () => null : MockEmailSignInButton,
    GoogleSignInButton: isDisabled ? () => null : MockGoogleSignInButton,
    $isDisabled: isDisabled,
    $isReady: isReady,
  })

describe('SignInOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render email, Google, divider, and wallet buttons when email auth is enabled', () => {
    mockEmailAuthFeature(false)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.getByTestId('email-login-btn')).toBeInTheDocument()
    expect(screen.getByTestId('google-login-btn')).toBeInTheDocument()
    expect(screen.getByText('OR')).toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
  })

  it('should render only wallet button when email auth is disabled', () => {
    mockEmailAuthFeature(true)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.queryByTestId('email-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('google-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByText('OR')).not.toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
  })

  it('should render only wallet button while feature is loading', () => {
    mockEmailAuthFeature(false, false)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.queryByTestId('email-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('google-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByText('OR')).not.toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
  })

  it('should show "Continue with wallet" text on the wallet button', () => {
    mockEmailAuthFeature(false)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.getByText('Continue with wallet')).toBeInTheDocument()
  })
})
