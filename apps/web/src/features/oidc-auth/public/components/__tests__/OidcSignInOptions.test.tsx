import { render, screen } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useChains from '@/hooks/useChains'
import OidcSignInOptions from '../OidcSignInOptions'

jest.mock('../../../components/GoogleSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="google-login-btn">Continue with Google</button>,
}))
jest.mock('../../../components/EmailSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="email-login-btn">Continue with email</button>,
}))

const mockOidcAuthFlag = (enabled: boolean | undefined) =>
  jest
    .spyOn(useChains, 'useHasFeature')
    .mockImplementation((feature) => (feature === FEATURES.OIDC_AUTH ? enabled : false))

describe('OidcSignInOptions', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows no divider while the chunk loads, then the divider and both buttons together', async () => {
    mockOidcAuthFlag(true)

    render(<OidcSignInOptions />)

    expect(screen.queryByText('OR')).not.toBeInTheDocument()
    expect(await screen.findByText('OR')).toBeInTheDocument()
    expect(screen.getByTestId('google-login-btn')).toBeInTheDocument()
    expect(screen.getByTestId('email-login-btn')).toBeInTheDocument()
  })

  it.each([false, undefined])('renders nothing while the OIDC flag is %s', (enabled) => {
    mockOidcAuthFlag(enabled)

    const { container } = render(<OidcSignInOptions />)

    expect(container).toBeEmptyDOMElement()
  })
})
