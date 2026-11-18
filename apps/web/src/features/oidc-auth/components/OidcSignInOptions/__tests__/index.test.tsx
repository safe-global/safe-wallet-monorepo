import { render, screen } from '@/tests/test-utils'
import OidcSignInOptions from '../index'

jest.mock('../../GoogleSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="google-login-btn">Continue with Google</button>,
}))
jest.mock('../../EmailSignInButton', () => ({
  __esModule: true,
  default: () => <button data-testid="email-login-btn">Continue with email</button>,
}))

describe('OidcSignInOptions', () => {
  it('renders the divider above the Google and email buttons', () => {
    render(<OidcSignInOptions />)

    const divider = screen.getByText('OR')
    const google = screen.getByTestId('google-login-btn')
    const email = screen.getByTestId('email-login-btn')

    expect(divider.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
    expect(google.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0)
  })
})
