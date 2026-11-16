import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { HnLoginCard } from '../HnLoginCard'
import { trackEvent } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

const mockInitiateLogin = jest.fn()

jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: () => true,
}))

jest.mock('../../../hooks/useHypernativeOAuth', () => ({
  useHypernativeOAuth: () => ({
    isAuthenticated: false,
    isTokenExpired: false,
    initiateLogin: mockInitiateLogin,
  }),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))
jest.mock('@/services/analytics/events/hypernative', () => ({
  ...jest.requireActual('@/services/analytics/events/hypernative'),
  HYPERNATIVE_EVENTS: jest.requireActual('@/services/analytics/events/hypernative').HYPERNATIVE_EVENTS,
}))

describe('HnLoginCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track HYPERNATIVE_LOGIN_CLICKED with Queue source when login is clicked', async () => {
    const user = userEvent.setup()

    render(<HnLoginCard />)

    await user.click(screen.getByText('Log in'))

    expect(trackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Queue,
    })
    expect(mockInitiateLogin).toHaveBeenCalled()
  })
})
