import { computePollingInterval } from '../computePollingInterval'
import {
  ARBITRATION_POLL_MS,
  ARBITRATION_WINDOW_MS,
  LATE_WINDOW_BLOCKS,
  PLAIN_DEADLINE_BLOCKS,
  POLL_INTERVAL_FAST_MS,
  POLL_INTERVAL_LATE_MS,
  UNAVAILABLE_GRACE_MS,
  UNAVAILABLE_GRACE_POLL_MS,
} from '../../constants'
import { CheckStatus } from '../../types'

describe('computePollingInterval', () => {
  it.each([CheckStatus.MALICIOUS, CheckStatus.VERIFICATION_FAILED])(
    'stops polling on the terminal status %s',
    (status) => {
      expect(computePollingInterval({ status, headBlock: '10', deadlineBlock: '150', firstEventBlock: '100' })).toBe(0)
    },
  )

  describe('BENIGN — bounded arbitration window instead of an immediate stop', () => {
    const ATTESTED = 1_700_000_000_000
    const benign = { status: CheckStatus.BENIGN, headBlock: '200', deadlineBlock: '150', firstEventBlock: '100' }

    it('polls slowly inside the arbitration window (a rejection can still land)', () => {
      expect(computePollingInterval({ ...benign, attestedAtMs: ATTESTED, nowMs: ATTESTED + 1_000 })).toBe(
        ARBITRATION_POLL_MS,
      )
    })

    it('polls slowly right up to the last ms of the arbitration window', () => {
      expect(
        computePollingInterval({ ...benign, attestedAtMs: ATTESTED, nowMs: ATTESTED + ARBITRATION_WINDOW_MS - 1 }),
      ).toBe(ARBITRATION_POLL_MS)
    })

    it('stops at the arbitration boundary', () => {
      expect(
        computePollingInterval({ ...benign, attestedAtMs: ATTESTED, nowMs: ATTESTED + ARBITRATION_WINDOW_MS }),
      ).toBe(0)
    })

    it('stops past the arbitration window (a settled check must not poll forever)', () => {
      expect(
        computePollingInterval({
          ...benign,
          attestedAtMs: ATTESTED,
          nowMs: ATTESTED + ARBITRATION_WINDOW_MS + 60_000,
        }),
      ).toBe(0)
    })

    it('stops on an attestation stamped in the future (clock skew must not stretch the window)', () => {
      expect(computePollingInterval({ ...benign, attestedAtMs: ATTESTED + 3_600_000, nowMs: ATTESTED })).toBe(0)
    })

    it('stops when the attestation time is unknown (nothing anchors the window)', () => {
      expect(computePollingInterval({ ...benign, attestedAtMs: null, nowMs: ATTESTED })).toBe(0)
      expect(computePollingInterval(benign)).toBe(0)
    })
  })

  describe('UNAVAILABLE — bounded grace window instead of an immediate stop', () => {
    const SUBMITTED = 1_700_000_000_000
    const unavailable = { status: CheckStatus.UNAVAILABLE, headBlock: null, deadlineBlock: null, firstEventBlock: null }

    it('polls slowly inside the grace window (the check request may still be mining)', () => {
      expect(computePollingInterval({ ...unavailable, submittedAtMs: SUBMITTED, nowMs: SUBMITTED + 1_000 })).toBe(
        UNAVAILABLE_GRACE_POLL_MS,
      )
    })

    it('polls slowly right up to the last ms of the grace window', () => {
      expect(
        computePollingInterval({
          ...unavailable,
          submittedAtMs: SUBMITTED,
          nowMs: SUBMITTED + UNAVAILABLE_GRACE_MS - 1,
        }),
      ).toBe(UNAVAILABLE_GRACE_POLL_MS)
    })

    it('stops at the grace boundary', () => {
      expect(
        computePollingInterval({ ...unavailable, submittedAtMs: SUBMITTED, nowMs: SUBMITTED + UNAVAILABLE_GRACE_MS }),
      ).toBe(0)
    })

    it('stops past the grace window (a row with no check must not poll forever)', () => {
      expect(
        computePollingInterval({
          ...unavailable,
          submittedAtMs: SUBMITTED,
          nowMs: SUBMITTED + UNAVAILABLE_GRACE_MS + 60_000,
        }),
      ).toBe(0)
    })

    it('stops on a submission stamped in the future (clock skew must not stretch the window)', () => {
      expect(computePollingInterval({ ...unavailable, submittedAtMs: SUBMITTED + 3_600_000, nowMs: SUBMITTED })).toBe(0)
    })

    it('stops when the submission time is unknown (nothing anchors the window)', () => {
      expect(computePollingInterval({ ...unavailable, submittedAtMs: null, nowMs: 1_700_000_000_000 })).toBe(0)
      expect(computePollingInterval(unavailable)).toBe(0)
    })

    it('keeps the grace window while a pinned snapshot is present', () => {
      // NO_CHECK arrives with a snapshot and its head block; the window still
      // applies, since the missing check is what polling waits for.
      expect(
        computePollingInterval({
          status: CheckStatus.UNAVAILABLE,
          headBlock: '200',
          deadlineBlock: '150',
          firstEventBlock: '100',
          submittedAtMs: SUBMITTED,
          nowMs: SUBMITTED + 1_000,
        }),
      ).toBe(UNAVAILABLE_GRACE_POLL_MS)
    })
  })

  it('polls fast before the deadline', () => {
    expect(
      computePollingInterval({
        status: CheckStatus.IN_PROGRESS,
        headBlock: '140',
        deadlineBlock: '150',
        firstEventBlock: '100',
      }),
    ).toBe(POLL_INTERVAL_FAST_MS)
  })

  it('polls fast at head == deadline (still in-window)', () => {
    expect(
      computePollingInterval({
        status: CheckStatus.IN_PROGRESS,
        headBlock: '150',
        deadlineBlock: '150',
        firstEventBlock: '100',
      }),
    ).toBe(POLL_INTERVAL_FAST_MS)
  })

  it('drops to the late interval at head == deadline + 1 (first out-of-window block)', () => {
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: '151',
        deadlineBlock: '150',
        firstEventBlock: '100',
      }),
    ).toBe(POLL_INTERVAL_LATE_MS)
  })

  it('polls fast when the head is unknown, even with a deadline on record', () => {
    // The arithmetic needs both sides. A missing head fails open to fast,
    // and must not be read as "past the deadline".
    expect(
      computePollingInterval({
        status: CheckStatus.IN_PROGRESS,
        headBlock: null,
        deadlineBlock: '150',
        firstEventBlock: '100',
      }),
    ).toBe(POLL_INTERVAL_FAST_MS)
  })

  it('polls fast on a pinned TIMED_OUT whose re-read lost both anchors', () => {
    // A transient empty read nulls the anchors while the pin keeps the status.
    // Failing open keeps the late-BENIGN upgrade reachable.
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: '10000',
        deadlineBlock: null,
        firstEventBlock: null,
      }),
    ).toBe(POLL_INTERVAL_FAST_MS)
  })

  it('polls fast when nothing anchors a deadline yet (first read not landed)', () => {
    expect(
      computePollingInterval({
        status: CheckStatus.SUBMITTED,
        headBlock: '140',
        deadlineBlock: null,
        firstEventBlock: null,
      }),
    ).toBe(POLL_INTERVAL_FAST_MS)
  })

  it('polls slowly in the post-deadline late window (a late BENIGN can still land)', () => {
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: '200',
        deadlineBlock: '150',
        firstEventBlock: '100',
      }),
    ).toBe(POLL_INTERVAL_LATE_MS)
  })

  it('polls slowly right up to the end of the late window', () => {
    const deadline = 150
    const head = deadline + LATE_WINDOW_BLOCKS
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: String(head),
        deadlineBlock: String(deadline),
        firstEventBlock: '100',
      }),
    ).toBe(POLL_INTERVAL_LATE_MS)
  })

  it('stops once the late window closes', () => {
    const deadline = 150
    const head = deadline + LATE_WINDOW_BLOCKS + 1
    expect(
      computePollingInterval({
        status: CheckStatus.TIMED_OUT,
        headBlock: String(head),
        deadlineBlock: String(deadline),
        firstEventBlock: '100',
      }),
    ).toBe(0)
  })

  describe('plain path — no on-chain deadline, first event anchors the window', () => {
    const first = 1_000

    it('polls fast within PLAIN_DEADLINE_BLOCKS of the first event', () => {
      expect(
        computePollingInterval({
          status: CheckStatus.SUBMITTED,
          headBlock: String(first + PLAIN_DEADLINE_BLOCKS),
          deadlineBlock: null,
          firstEventBlock: String(first),
        }),
      ).toBe(POLL_INTERVAL_FAST_MS)
    })

    it('drops to the late interval past the substitute deadline', () => {
      expect(
        computePollingInterval({
          status: CheckStatus.SUBMITTED,
          headBlock: String(first + PLAIN_DEADLINE_BLOCKS + 1),
          deadlineBlock: null,
          firstEventBlock: String(first),
        }),
      ).toBe(POLL_INTERVAL_LATE_MS)
    })

    it('still polls slowly at the last block of the late window (inclusive close)', () => {
      expect(
        computePollingInterval({
          status: CheckStatus.SUBMITTED,
          headBlock: String(first + PLAIN_DEADLINE_BLOCKS + LATE_WINDOW_BLOCKS),
          deadlineBlock: null,
          firstEventBlock: String(first),
        }),
      ).toBe(POLL_INTERVAL_LATE_MS)
    })

    it('stops once the late window closes — a never-attested check must not poll forever', () => {
      expect(
        computePollingInterval({
          status: CheckStatus.SUBMITTED,
          headBlock: String(first + PLAIN_DEADLINE_BLOCKS + LATE_WINDOW_BLOCKS + 1),
          deadlineBlock: null,
          firstEventBlock: String(first),
        }),
      ).toBe(0)
    })

    it('an on-chain deadline wins over the substitute', () => {
      // Deadline far beyond the substitute window: still fast.
      expect(
        computePollingInterval({
          status: CheckStatus.IN_PROGRESS,
          headBlock: String(first + PLAIN_DEADLINE_BLOCKS + LATE_WINDOW_BLOCKS + 100),
          deadlineBlock: String(first + 10_000),
          firstEventBlock: String(first),
        }),
      ).toBe(POLL_INTERVAL_FAST_MS)
    })
  })

  describe('AWAITING_VERIFICATION — the status a PENDING verification produces', () => {
    it('keeps polling fast before the deadline (the group key can still arrive)', () => {
      expect(
        computePollingInterval({
          status: CheckStatus.AWAITING_VERIFICATION,
          headBlock: '140',
          deadlineBlock: '150',
          firstEventBlock: '100',
        }),
      ).toBe(POLL_INTERVAL_FAST_MS)
    })

    it('keeps polling slowly through the late window', () => {
      expect(
        computePollingInterval({
          status: CheckStatus.AWAITING_VERIFICATION,
          headBlock: '200',
          deadlineBlock: '150',
          firstEventBlock: '100',
        }),
      ).toBe(POLL_INTERVAL_LATE_MS)
    })
  })
})
