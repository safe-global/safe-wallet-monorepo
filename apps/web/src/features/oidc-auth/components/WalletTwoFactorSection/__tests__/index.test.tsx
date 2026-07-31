import { render, screen } from '@/tests/test-utils'
import WalletTwoFactorSection from '../index'

const mockUseHasFeature = jest.fn(() => true)
const mockUseAuthGetMe = jest.fn()

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthGetMeV1Query: () => mockUseAuthGetMe(),
}))

describe('WalletTwoFactorSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseAuthGetMe.mockReturnValue({ data: { authMethod: 'siwe', signerAddress: '0xabc' } })
  })

  it('renders nothing for an OIDC (email/Google) session', () => {
    mockUseAuthGetMe.mockReturnValue({ data: { authMethod: 'oidc', email: 'a@b.com' } })

    const { container } = render(<WalletTwoFactorSection />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the switch-authenticator feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = render(<WalletTwoFactorSection />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the informational 2FA card for a wallet (SIWE) session', () => {
    render(<WalletTwoFactorSection />)

    expect(screen.getByTestId('settings-wallet-2fa')).toBeInTheDocument()
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument()
    expect(screen.getByText('Not active for wallet sign-in')).toBeInTheDocument()
  })

  it('tells wallet users to create a new email or Google account, not to sign in with one', () => {
    render(<WalletTwoFactorSection />)

    expect(screen.getByText(/create a new email or Google account instead/)).toBeInTheDocument()
  })
})
