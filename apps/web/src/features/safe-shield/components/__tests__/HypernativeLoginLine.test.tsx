import { fireEvent, render, screen } from '@/tests/test-utils'
import { hypernativeAuthStatusBuilder } from '@/tests/builders/hypernativeAuthStatus'
import { HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HypernativeLoginLine } from '../HypernativeLoginLine'

const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))

describe('HypernativeLoginLine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing without Hypernative auth', () => {
    const { container } = render(<HypernativeLoginLine />)

    expect(container).toBeEmptyDOMElement()
  })

  it('offers a logged-out user to log in, tracking the click with the Copilot source', () => {
    const hypernativeAuth = hypernativeAuthStatusBuilder().build()
    render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    expect(screen.getByTestId('hypernative-login-line')).toHaveTextContent('Already using Hypernative? Log in')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(hypernativeAuth.initiateLogin).toHaveBeenCalled()
    expect(mockTrackEvent).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Copilot,
    })
  })

  it('offers the login again when the token expired', () => {
    const hypernativeAuth = hypernativeAuthStatusBuilder().with({ isAuthenticated: true, isTokenExpired: true }).build()
    render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    expect(screen.getByTestId('hypernative-login-line')).toBeInTheDocument()
  })

  it('renders nothing while the user is logged in', () => {
    const hypernativeAuth = hypernativeAuthStatusBuilder().with({ isAuthenticated: true }).build()
    const { container } = render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    expect(container).toBeEmptyDOMElement()
  })
})
