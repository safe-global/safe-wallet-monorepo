import { computePollingInterval } from '../computePollingInterval'
import { LATE_WINDOW_BLOCKS, POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../../constants'
import { CheckStatus } from '../../types'

describe('computePollingInterval', () => {
  it.each([CheckStatus.BENIGN, CheckStatus.MALICIOUS, CheckStatus.VERIFICATION_FAILED])(
    'stops polling on the terminal status %s',
    (status) => {
      expect(computePollingInterval({ status, headBlock: '10', deadlineBlock: '150' })).toEqual({
        shouldPoll: false,
        intervalMs: 0,
      })
    },
  )

  it('polls fast before the deadline', () => {
    expect(computePollingInterval({ status: CheckStatus.IN_PROGRESS, headBlock: '140', deadlineBlock: '150' })).toEqual(
      {
        shouldPoll: true,
        intervalMs: POLL_INTERVAL_FAST_MS,
      },
    )
  })

  it('polls fast at head == deadline (still in-window)', () => {
    expect(computePollingInterval({ status: CheckStatus.IN_PROGRESS, headBlock: '150', deadlineBlock: '150' })).toEqual(
      {
        shouldPoll: true,
        intervalMs: POLL_INTERVAL_FAST_MS,
      },
    )
  })

  it('polls fast when the deadline is unknown', () => {
    expect(computePollingInterval({ status: CheckStatus.SUBMITTED, headBlock: '140', deadlineBlock: null })).toEqual({
      shouldPoll: true,
      intervalMs: POLL_INTERVAL_FAST_MS,
    })
  })

  it('polls slowly in the post-deadline late window (a late BENIGN can still land)', () => {
    expect(computePollingInterval({ status: CheckStatus.TIMED_OUT, headBlock: '200', deadlineBlock: '150' })).toEqual({
      shouldPoll: true,
      intervalMs: POLL_INTERVAL_LATE_MS,
    })
  })

  it('polls slowly right up to the end of the late window', () => {
    const deadline = 150
    const head = deadline + LATE_WINDOW_BLOCKS
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: String(head),
        deadlineBlock: String(deadline),
      }),
    ).toEqual({ shouldPoll: true, intervalMs: POLL_INTERVAL_LATE_MS })
  })

  it('stops once the late window closes', () => {
    const deadline = 150
    const head = deadline + LATE_WINDOW_BLOCKS + 1
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: String(head),
        deadlineBlock: String(deadline),
      }),
    ).toEqual({ shouldPoll: false, intervalMs: 0 })
  })
})
