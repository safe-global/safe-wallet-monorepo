import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { hypernativeAuthStatusBuilder } from '@/tests/builders/hypernativeAuthStatus'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HypernativeLoginLine } from './HypernativeLoginLine'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  HYPERNATIVE_EVENTS: jest.requireActual('@/services/analytics').HYPERNATIVE_EVENTS,
}))

const RECONNECT_MESSAGE = "Please reconnect your Hypernative account to review this transaction's risks."

describe('HypernativeLoginLine', () => {
  it('asks a signed-out user to log in', () => {
    const hypernativeAuth = hypernativeAuthStatusBuilder().build()

    render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    expect(screen.getByText('Already using Hypernative?')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeVisible()
  })

  it('asks to reconnect when the API rejected the session', () => {
    const hypernativeAuth = hypernativeAuthStatusBuilder().with({ isSessionRejected: true }).build()

    render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    expect(screen.getByText(RECONNECT_MESSAGE)).toBeVisible()
    expect(screen.queryByText('Already using Hypernative?')).not.toBeInTheDocument()
  })

  it('opens the Hypernative login when Reconnect is clicked', async () => {
    const user = userEvent.setup()
    const hypernativeAuth = hypernativeAuthStatusBuilder().with({ isSessionRejected: true }).build()
    render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    await user.click(screen.getByRole('button', { name: 'Reconnect to Hypernative' }))

    expect(hypernativeAuth.initiateLogin).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Copilot,
    })
  })

  it('renders nothing for a signed-in user', () => {
    const hypernativeAuth = hypernativeAuthStatusBuilder().with({ isAuthenticated: true }).build()

    const { container } = render(<HypernativeLoginLine hypernativeAuth={hypernativeAuth} />)

    expect(container).toBeEmptyDOMElement()
  })
})
