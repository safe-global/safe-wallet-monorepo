import { fireEvent, render, screen } from '@/tests/test-utils'
import { HypernativeLoginLine } from '../HypernativeLoginLine'

const mockInitiateLogin = jest.fn()
let mockAuth = { isAuthenticated: false, isTokenExpired: false, initiateLogin: mockInitiateLogin }
jest.mock('@/features/hypernative', () => ({ useHypernativeOAuth: () => mockAuth }))
const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

describe('HypernativeLoginLine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth = { isAuthenticated: false, isTokenExpired: false, initiateLogin: mockInitiateLogin }
  })

  it('offers a Hypernative customer to log in, tracking the click', () => {
    render(<HypernativeLoginLine />)

    expect(screen.getByTestId('hypernative-login-line')).toHaveTextContent('Already using Hypernative? Log in')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(mockInitiateLogin).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
  })

  it('shows again when the session expired and hides while logged in', () => {
    mockAuth = { ...mockAuth, isAuthenticated: true, isTokenExpired: true }
    const { unmount } = render(<HypernativeLoginLine />)
    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
    unmount()

    mockAuth = { ...mockAuth, isAuthenticated: true, isTokenExpired: false }
    expect(render(<HypernativeLoginLine />).container).toBeEmptyDOMElement()
  })
})
