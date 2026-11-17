import { faker } from '@faker-js/faker'
import { act, fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { Notification } from '@/store/notificationsSlice'
import Notifications from './index'

jest.mock('@/services/analytics', () =>
  (
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
)
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const makeNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'n1',
  message: 'Your transaction was submitted',
  groupKey: 'tx',
  variant: 'info',
  timestamp: 0,
  ...overrides,
})

const renderNotifications = (notification: Notification) =>
  render(<Notifications />, { initialReduxState: { notifications: [notification] } })

describe('Notifications', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('auto-hides an info toast after 5s', () => {
    renderNotifications(makeNotification())

    expect(screen.getByText('Your transaction was submitted')).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(5000))

    expect(screen.queryByText('Your transaction was submitted')).not.toBeInTheDocument()
  })

  it('does not extend the countdown when the parent re-renders', () => {
    const { rerender } = renderNotifications(makeNotification())

    act(() => jest.advanceTimersByTime(4000))
    // A second toast arriving, a route change, or any parent update re-renders Notifications and hands
    // Toast a brand new `onClose` — that must not restart the countdown.
    rerender(<Notifications />)
    act(() => jest.advanceTimersByTime(1000))

    expect(screen.queryByText('Your transaction was submitted')).not.toBeInTheDocument()
  })

  it('pauses the countdown while hovered and resumes on leave', () => {
    renderNotifications(makeNotification())

    const toast = screen.getByText('Your transaction was submitted')

    act(() => jest.advanceTimersByTime(4000))
    act(() => {
      toast.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })

    // Well past the original 5s: hovering has to hold the toast open.
    act(() => jest.advanceTimersByTime(10_000))
    expect(screen.getByText('Your transaction was submitted')).toBeInTheDocument()

    act(() => {
      toast.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    })
    act(() => jest.advanceTimersByTime(5000))
    expect(screen.queryByText('Your transaction was submitted')).not.toBeInTheDocument()
  })

  it('never auto-hides error or warning toasts', () => {
    renderNotifications(makeNotification({ variant: 'error', message: 'Signing failed' }))

    act(() => jest.advanceTimersByTime(60_000))

    expect(screen.getByText('Signing failed')).toBeInTheDocument()
  })

  it('never auto-hides a toast with autoHideDuration: null', () => {
    renderNotifications(makeNotification({ autoHideDuration: null, message: 'Awaiting confirmations' }))

    act(() => jest.advanceTimersByTime(60_000))

    expect(screen.getByText('Awaiting confirmations')).toBeInTheDocument()
  })

  it('tracks the event of a link once on click, next to the notification interaction', () => {
    mockTrackEvent.mockClear()
    const params = { workspace_id: faker.string.uuid(), transactions: 1 }
    renderNotifications(
      makeNotification({
        link: {
          href: '/spaces/transactions',
          title: 'View transactions',
          track: { event: SPACE_EVENTS.QUEUE_NOTIFICATION_CLICKED, params },
        },
      }),
    )

    fireEvent.click(screen.getByText('View transactions'))

    expect(mockTrackEvent).toHaveBeenCalledTimes(2)
    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.QUEUE_NOTIFICATION_CLICKED, params)
    expect(mockTrackEvent).toHaveBeenCalledWith(
      { ...OVERVIEW_EVENTS.NOTIFICATION_INTERACTION, label: 'View transactions' },
      undefined,
    )
  })
})
