import { render, screen } from '@/tests/test-utils'
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

jest.mock('@/features/oidc-auth/public/components/OidcSignInOptions', () => ({
  __esModule: true,
  default: () => <div data-testid="oidc-sign-in-options" />,
}))

describe('SignInOptions', () => {
  it('renders the wallet button above the OIDC options', () => {
    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    const wallet = screen.getByTestId('connect-wallet-btn')
    const oidc = screen.getByTestId('oidc-sign-in-options')

    expect(wallet.compareDocumentPosition(oidc) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })

  it('should show "Connect wallet" text on the wallet button', () => {
    render(<SignInOptions afterSignIn={mockAfterSignIn} />)

    expect(screen.getByText('Connect wallet')).toBeInTheDocument()
  })
})
