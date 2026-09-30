import { render, screen } from '@/tests/test-utils'
import SwitchAuthenticatorSection from '../index'

const mockUseHasFeature = jest.fn(() => true)
const mockUseAuthenticators = jest.fn()

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: () => mockUseHasFeature(),
}))

jest.mock('../../../hooks/useAuthenticators', () => ({
  useAuthenticators: () => mockUseAuthenticators(),
}))

describe('SwitchAuthenticatorSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseAuthenticators.mockReturnValue({
      isOidcSession: true,
      authenticators: [{ id: '1', type: 'totp', createdAt: '2026-04-22T00:00:00.000Z' }],
      error: undefined,
      enrollNewAuthenticator: jest.fn(),
    })
  })

  it('renders nothing for a non-OIDC session', () => {
    mockUseAuthenticators.mockReturnValue({ isOidcSession: false, authenticators: undefined })

    const { container } = render(<SwitchAuthenticatorSection />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the switch-authenticator feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { container } = render(<SwitchAuthenticatorSection />)

    expect(container).toBeEmptyDOMElement()
  })

  it('marks 2FA as active when an authenticator is enrolled', () => {
    render(<SwitchAuthenticatorSection />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByTestId('authenticator-row')).toBeInTheDocument()
  })

  it('offers to add an authenticator when none is enrolled', () => {
    mockUseAuthenticators.mockReturnValue({
      isOidcSession: true,
      authenticators: [],
      error: undefined,
      enrollNewAuthenticator: jest.fn(),
    })

    render(<SwitchAuthenticatorSection />)

    expect(screen.queryByText('Active')).not.toBeInTheDocument()
    expect(screen.getByTestId('add-authenticator-btn')).toBeInTheDocument()
  })
})
