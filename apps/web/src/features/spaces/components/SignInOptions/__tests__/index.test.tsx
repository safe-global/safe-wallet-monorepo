import { render, screen } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useChains from '@/hooks/useChains'
import SignInOptions from '../index'

const mockAfterSignIn = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))
jest.mock('@/services/analytics/types', () => ({
  ...jest.requireActual('@/services/analytics/types'),
  EventType: { META: 'meta' },
}))

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: () => ({ signIn: jest.fn(), loading: false }),
}))

jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => null,
}))

jest.mock('@/features/oidc-auth/public/components/EmailSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="email-login-btn">Continue with email</button>,
}))
jest.mock('@/features/oidc-auth/public/components/GoogleSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="google-login-btn">Continue with Google</button>,
}))

const mockOidcAuthFlag = (enabled: boolean | undefined) =>
  jest
    .spyOn(useChains, 'useHasFeature')
    .mockImplementation((feature) => (feature === FEATURES.OIDC_AUTH ? enabled : false))

describe('SignInOptions', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('should render wallet, divider, Google, and email buttons when OIDC auth is enabled', () => {
    mockOidcAuthFlag(true)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
    expect(screen.getByText('OR')).toBeInTheDocument()
    expect(screen.getByTestId('google-login-btn')).toBeInTheDocument()
    expect(screen.getByTestId('email-login-btn')).toBeInTheDocument()
  })

  it('should render the wallet button first, above the divider and OIDC options', () => {
    mockOidcAuthFlag(true)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    const wallet = screen.getByTestId('connect-wallet-btn')
    const divider = screen.getByText('OR')
    const google = screen.getByTestId('google-login-btn')
    const email = screen.getByTestId('email-login-btn')

    expect(wallet.compareDocumentPosition(divider) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(divider.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(google.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it('should render only wallet button when OIDC auth is disabled', () => {
    mockOidcAuthFlag(false)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.queryByTestId('email-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('google-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByText('OR')).not.toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
  })

  it('should render only wallet button while the chain feature flags are loading', () => {
    mockOidcAuthFlag(undefined)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.queryByTestId('email-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('google-login-btn')).not.toBeInTheDocument()
    expect(screen.queryByText('OR')).not.toBeInTheDocument()
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument()
  })

  it('should show "Connect wallet" text on the wallet button', () => {
    mockOidcAuthFlag(true)

    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.getByText('Connect wallet')).toBeInTheDocument()
  })
})
