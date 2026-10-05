import { buildRequestSnapshot } from '../../builders'
import {
  ARBITRATION_POLL_MS,
  LATE_WINDOW_BLOCKS,
  POLL_INTERVAL_FAST_MS,
  POLL_INTERVAL_LATE_MS,
  UNAVAILABLE_GRACE_MS,
  UNAVAILABLE_GRACE_POLL_MS,
} from '../../constants'
import { AttestationVerificationStatus as Attestation, type RequestOutcome, type RequestSnapshot } from '../../types'
import { computePollingInterval } from '../computePollingInterval'

const REVEAL_DEADLINE = 1_000
const ARBITRATION_DEADLINE = 1_400
const SUBMITTED_AT = 1_700_000_000_000
const FAR_BLOCKS = 5_000_000

const OUTCOME_SHAPES: Record<RequestOutcome, Partial<RequestSnapshot>> = {
  PENDING: { state: 'PENDING' },
  APPROVED: { state: 'RESOLVED_APPROVED', committedCount: 2, revealedCount: 2, approveCount: 2 },
  DENIED: { state: 'RESOLVED_DENIED', committedCount: 2, revealedCount: 2, denyCount: 2 },
  DISPUTED: {
    state: 'FROZEN',
    committedCount: 2,
    revealedCount: 2,
    approveCount: 1,
    denyCount: 1,
    arbitrationDeadlineBlock: String(ARBITRATION_DEADLINE),
  },
  RULED_SECURE: { state: 'RESOLVED_APPROVED', committedCount: 3, revealedCount: 3, approveCount: 2, denyCount: 1 },
  RULED_INSECURE: { state: 'RESOLVED_DENIED', committedCount: 3, revealedCount: 3, approveCount: 1, denyCount: 2 },
  NO_RULING: { state: 'TIMED_OUT', committedCount: 2, revealedCount: 2, approveCount: 1, denyCount: 1 },
  TIMED_OUT: { state: 'TIMED_OUT' },
}

const request = (outcome: RequestOutcome, over: Partial<RequestSnapshot> = {}): RequestSnapshot =>
  buildRequestSnapshot({
    outcome,
    revealDeadlineBlock: String(REVEAL_DEADLINE),
    ...OUTCOME_SHAPES[outcome],
    ...over,
  })

const approved = (status: Attestation): RequestSnapshot =>
  request('APPROVED', { attestation: { status, signatureId: null, message: null } })

const poll = (
  requests: RequestSnapshot[],
  head: number | null,
  timing: { submittedAtMs?: number | null; nowMs?: number } = {},
): number => computePollingInterval({ requests, headBlock: head === null ? null : String(head), ...timing })

describe('computePollingInterval — no request found', () => {
  const pollAfter = (timing: { submittedAtMs?: number | null; nowMs?: number }): number =>
    computePollingInterval({ requests: [], headBlock: null, ...timing })

  it.each<[string, number]>([
    ['at the moment of submission', 0],
    ['shortly after submission', 1_000],
    ['in the last millisecond of the window', UNAVAILABLE_GRACE_MS - 1],
  ])('polls slowly %s', (_when, age) => {
    expect(pollAfter({ submittedAtMs: SUBMITTED_AT, nowMs: SUBMITTED_AT + age })).toBe(UNAVAILABLE_GRACE_POLL_MS)
  })

  it.each<[string, number]>([
    ['exactly when the window ends', UNAVAILABLE_GRACE_MS],
    ['after the window', UNAVAILABLE_GRACE_MS + 60_000],
    ['for a submission stamped one millisecond in the future', -1],
    ['for a submission stamped an hour in the future', -3_600_000],
  ])('stops %s', (_when, age) => {
    expect(pollAfter({ submittedAtMs: SUBMITTED_AT, nowMs: SUBMITTED_AT + age })).toBe(0)
  })

  it('stops when the submission time is unknown', () => {
    expect(pollAfter({ submittedAtMs: null, nowMs: SUBMITTED_AT })).toBe(0)
    expect(pollAfter({ nowMs: SUBMITTED_AT })).toBe(0)
  })

  it('stops when the caller gives no clock reading', () => {
    expect(pollAfter({ submittedAtMs: SUBMITTED_AT })).toBe(0)
  })

  it('applies the window whatever head the empty read observed', () => {
    expect(poll([], REVEAL_DEADLINE, { submittedAtMs: SUBMITTED_AT, nowMs: SUBMITTED_AT + 1_000 })).toBe(
      UNAVAILABLE_GRACE_POLL_MS,
    )
  })
})

describe('computePollingInterval — pending request', () => {
  it.each<[string, number]>([
    ['well before its reveal deadline', REVEAL_DEADLINE - 500],
    ['one block before its reveal deadline', REVEAL_DEADLINE - 1],
    ['exactly at its reveal deadline', REVEAL_DEADLINE],
  ])('polls fast with the head %s', (_where, head) => {
    expect(poll([request('PENDING')], head)).toBe(POLL_INTERVAL_FAST_MS)
  })

  it.each<[string, number]>([
    ['one block after its reveal deadline', REVEAL_DEADLINE + 1],
    ['far beyond its reveal deadline', REVEAL_DEADLINE + FAR_BLOCKS],
  ])('keeps polling slowly, never stops, with the head %s', (_where, head) => {
    expect(poll([request('PENDING')], head)).toBe(POLL_INTERVAL_LATE_MS)
  })

  it('polls fast while the head is unknown', () => {
    expect(poll([request('PENDING')], null)).toBe(POLL_INTERVAL_FAST_MS)
  })
})

describe.each([Attestation.UNVERIFIED, Attestation.PENDING])(
  'computePollingInterval — approval with a %s attestation',
  (status) => {
    const lateWindowEnd = REVEAL_DEADLINE + LATE_WINDOW_BLOCKS

    it.each<[string, number]>([
      ['before the reveal deadline', REVEAL_DEADLINE - 1],
      ['past the reveal deadline', REVEAL_DEADLINE + 1],
      ['exactly at the end of the late window', lateWindowEnd],
    ])('polls fast with the head %s', (_where, head) => {
      expect(poll([approved(status)], head)).toBe(POLL_INTERVAL_FAST_MS)
    })

    it.each<[string, number]>([
      ['one block past the late window', lateWindowEnd + 1],
      ['far past the late window', lateWindowEnd + FAR_BLOCKS],
    ])('keeps polling slowly, never stops, with the head %s', (_where, head) => {
      expect(poll([approved(status)], head)).toBe(POLL_INTERVAL_LATE_MS)
    })

    it('polls fast while the head is unknown', () => {
      expect(poll([approved(status)], null)).toBe(POLL_INTERVAL_FAST_MS)
    })
  },
)

describe('computePollingInterval — open dispute', () => {
  it.each<[string, number]>([
    ['before the reveal deadline', REVEAL_DEADLINE - 1],
    ['before its arbitration deadline', ARBITRATION_DEADLINE - 1],
    ['exactly at its arbitration deadline', ARBITRATION_DEADLINE],
    ['one block past its arbitration deadline', ARBITRATION_DEADLINE + 1],
    ['far past its arbitration deadline', ARBITRATION_DEADLINE + FAR_BLOCKS],
  ])('polls on the arbitration cadence with the head %s', (_where, head) => {
    expect(poll([request('DISPUTED')], head)).toBe(ARBITRATION_POLL_MS)
  })

  it('polls on the arbitration cadence while the head is unknown', () => {
    expect(poll([request('DISPUTED')], null)).toBe(ARBITRATION_POLL_MS)
  })
})

describe('computePollingInterval — settled requests', () => {
  const HEADS: Array<number | null> = [null, 0, REVEAL_DEADLINE, REVEAL_DEADLINE + LATE_WINDOW_BLOCKS, FAR_BLOCKS]

  const SETTLED: Array<[string, RequestSnapshot]> = [
    ['an approval with a verified attestation', approved(Attestation.VERIFIED)],
    ['an approval whose attestation failed verification', approved(Attestation.INVALID)],
    ['a unanimous denial', request('DENIED')],
    ['a Council secure ruling', request('RULED_SECURE')],
    ['a Council insecure ruling', request('RULED_INSECURE')],
    ['a request closed without a ruling', request('NO_RULING')],
    ['a timed-out request', request('TIMED_OUT')],
  ]

  it.each(SETTLED)('stops polling for %s at every head', (_label, settled) => {
    expect(HEADS.map((head) => poll([settled], head))).toEqual(HEADS.map(() => 0))
  })

  it('stops for several settled requests together', () => {
    const requests = SETTLED.map(([, settled]) => settled)

    expect(HEADS.map((head) => poll(requests, head))).toEqual(HEADS.map(() => 0))
  })

  it('ignores the grace window once a request exists', () => {
    expect(poll([request('DENIED')], REVEAL_DEADLINE, { submittedAtMs: SUBMITTED_AT, nowMs: SUBMITTED_AT })).toBe(0)
  })
})

describe('computePollingInterval — several requests', () => {
  it('lets a pending request in its fast window beat a dispute', () => {
    expect(poll([request('DISPUTED'), request('PENDING')], REVEAL_DEADLINE)).toBe(POLL_INTERVAL_FAST_MS)
  })

  it('lets a slowly polled pending request beat a dispute', () => {
    expect(poll([request('DISPUTED'), request('PENDING')], REVEAL_DEADLINE + 1)).toBe(POLL_INTERVAL_LATE_MS)
  })

  it('keeps the arbitration cadence for a dispute beside settled requests', () => {
    const requests = [approved(Attestation.VERIFIED), request('DISPUTED'), request('DENIED'), request('TIMED_OUT')]

    expect(poll(requests, ARBITRATION_DEADLINE + FAR_BLOCKS)).toBe(ARBITRATION_POLL_MS)
  })

  it('lets a request that can still change beat settled siblings', () => {
    expect(poll([request('DENIED'), request('PENDING')], REVEAL_DEADLINE)).toBe(POLL_INTERVAL_FAST_MS)
    expect(poll([approved(Attestation.VERIFIED), approved(Attestation.PENDING)], REVEAL_DEADLINE + 1)).toBe(
      POLL_INTERVAL_FAST_MS,
    )
  })

  it('keeps each request on its own reveal deadline', () => {
    const early = request('PENDING')
    const late = request('PENDING', { revealDeadlineBlock: String(REVEAL_DEADLINE + 1_000) })

    expect(poll([early, late], REVEAL_DEADLINE + 500)).toBe(POLL_INTERVAL_FAST_MS)
    expect(poll([early, late], REVEAL_DEADLINE + 1_001)).toBe(POLL_INTERVAL_LATE_MS)
  })

  it('does not depend on the order of the requests', () => {
    const requests = [request('DISPUTED'), request('DENIED'), approved(Attestation.UNVERIFIED), request('PENDING')]
    const head = REVEAL_DEADLINE + 1

    expect(poll([...requests].reverse(), head)).toBe(poll(requests, head))
  })

  it('polls a pending request on its own cadence whatever the submission time says', () => {
    const longAfterSubmission = { submittedAtMs: SUBMITTED_AT, nowMs: SUBMITTED_AT + UNAVAILABLE_GRACE_MS * 10 }

    expect(poll([request('PENDING')], REVEAL_DEADLINE, longAfterSubmission)).toBe(POLL_INTERVAL_FAST_MS)
  })
})
