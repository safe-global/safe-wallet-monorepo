import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { HnQueueAssessmentBanner } from '../HnQueueAssessmentBanner'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

const mockInitiateLogin = jest.fn()

jest.mock('../../../hooks/useHypernativeOAuth', () => ({
  useHypernativeOAuth: () => ({
    initiateLogin: mockInitiateLogin,
  }),
}))

jest.mock('../../../hooks/useAssessmentUrl', () => ({
  useAssessmentUrl: () => 'https://hypernative.io/assessment/123',
}))

jest.mock('../../../hooks/useHnAssessmentSeverity', () => ({
  useHnAssessmentSeverity: () => Severity.WARN,
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  HYPERNATIVE_EVENTS: jest.requireActual('@/services/analytics').HYPERNATIVE_EVENTS,
}))

describe('HnQueueAssessmentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track HYPERNATIVE_LOGIN_CLICKED with Queue source when login is clicked', async () => {
    const user = userEvent.setup()

    render(<HnQueueAssessmentBanner safeTxHash="0x123" assessment={undefined} isAuthenticated={false} />)

    await user.click(screen.getByText('Log in'))

    expect(trackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
      [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Queue,
    })
    expect(mockInitiateLogin).toHaveBeenCalled()
  })

  it('should track SECURITY_REPORT_CLICKED when View details is clicked', async () => {
    const user = userEvent.setup()

    render(<HnQueueAssessmentBanner safeTxHash="0x123" assessment={undefined} isAuthenticated={true} />)

    await user.click(screen.getByText('View details'))

    expect(trackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.SECURITY_REPORT_CLICKED)
  })
})
