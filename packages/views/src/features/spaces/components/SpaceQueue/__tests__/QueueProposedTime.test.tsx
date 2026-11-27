import { formatDateTime } from '@safe-global/utils/utils/date'
import { advanceClock, renderOnFakeClock, screen } from '@/tests/test-utils'
import QueueProposedTime from '@safe-global/views/features/spaces/components/SpaceQueue/QueueProposedTime'

describe('QueueProposedTime', () => {
  afterEach(() => jest.useRealTimers())

  it('shows the short time, with the full date and time in the tooltip', async () => {
    const timestamp = new Date('2026-06-15T12:00:00.000Z').getTime()
    jest.useFakeTimers({ now: timestamp + 3 * 24 * 60 * 60 * 1000 })

    const { user } = renderOnFakeClock(<QueueProposedTime timestamp={timestamp} />)

    const trigger = screen.getByText('3d ago')
    expect(screen.queryByText(formatDateTime(timestamp))).not.toBeInTheDocument()

    await user.hover(trigger)
    await advanceClock(500)

    expect(await screen.findByText(formatDateTime(timestamp))).toBeInTheDocument()
  })
})
