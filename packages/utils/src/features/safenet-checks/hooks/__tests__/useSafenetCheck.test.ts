import { renderHook } from '@testing-library/react'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { forgetAim, recordAim, resolveAim } from '@safe-global/store/safenet/safenetAimRegistry'
import { useSafenetCheck } from '../useSafenetCheck'
import {
  ARBITRATION_POLL_MS,
  LATE_WINDOW_BLOCKS,
  POLL_INTERVAL_FAST_MS,
  POLL_INTERVAL_LATE_MS,
  UNAVAILABLE_GRACE_MS,
  UNAVAILABLE_GRACE_POLL_MS,
} from '../../constants'
import { AttestationVerificationStatus, CheckStatus, type SafenetCheckSnapshot, type WindowCoverage } from '../../types'
import { buildBenignSnapshot, buildCheckView, buildRequestSnapshot, buildSnapshot } from '../../builders'

jest.mock('@safe-global/store/safenet/safenetCheckApi', () => ({
  useGetSafenetCheckQuery: jest.fn(),
}))

const mockQuery = useGetSafenetCheckQuery as unknown as jest.Mock

const HASH = ('0x' + 'ab'.repeat(32)) as `0x${string}`
const OTHER_HASH = ('0x' + 'cd'.repeat(32)) as `0x${string}`
const TARGET = { chainId: '100', safeAddress: '0x0000000000000000000000000000000000000abc' }
const OTHER_SAFE = { chainId: '100', safeAddress: '0x0000000000000000000000000000000000000def' }
const UNRESOLVED = { chainId: '', safeAddress: '' }
/** A transaction's submission date, and a later surrogate a surface might offer. */
const PROPOSED_AT = 1_700_000_000_000
const LATER_OFFER = PROPOSED_AT + 3_600_000

const REVEAL_DEADLINE_BLOCK = 160
const ARBITRATION_DEADLINE_BLOCK = 200

type RulingOutcome = 'RULED_SECURE' | 'NO_RULING'

/** The slice of the RTK query result the hook consumes, as the mock returns it. */
type QueryResult = {
  data?: SafenetCheckSnapshot
  error?: { message: string }
  isError?: boolean
  isLoading?: boolean
  isFetching?: boolean
  fulfilledTimeStamp?: number
  refetch?: jest.Mock
}

const refetchFn = jest.fn()

const queryResult = (over: QueryResult = {}): QueryResult => ({
  data: undefined,
  error: undefined,
  isLoading: false,
  isFetching: false,
  refetch: refetchFn,
  ...over,
})

const FETCH_ERROR = { message: 'rpc down' }

/** Last options object the query hook was invoked with. */
const lastOptions = () => mockQuery.mock.calls[mockQuery.mock.calls.length - 1][1]

const pendingAt = (headBlock: number): SafenetCheckSnapshot =>
  buildSnapshot({
    safeTxHash: HASH,
    status: CheckStatus.SUBMITTED,
    outcome: 'PENDING',
    headBlock: String(headBlock),
    requests: [buildRequestSnapshot({ revealDeadlineBlock: String(REVEAL_DEADLINE_BLOCK) })],
  })

const approvedAt = (
  headBlock: number,
  verification: AttestationVerificationStatus,
  status: CheckStatus,
): SafenetCheckSnapshot =>
  buildSnapshot({
    safeTxHash: HASH,
    status,
    outcome: 'APPROVED',
    headBlock: String(headBlock),
    requests: [
      buildRequestSnapshot({
        state: 'RESOLVED_APPROVED',
        outcome: 'APPROVED',
        revealDeadlineBlock: String(REVEAL_DEADLINE_BLOCK),
        committedCount: 2,
        revealedCount: 2,
        approveCount: 2,
        attestation: { status: verification, signatureId: null, message: null },
      }),
    ],
  })

const disputedAt = (headBlock: number): SafenetCheckSnapshot =>
  buildSnapshot({
    safeTxHash: HASH,
    status: CheckStatus.IN_PROGRESS,
    outcome: 'DISPUTED',
    headBlock: String(headBlock),
    requests: [
      buildRequestSnapshot({
        state: 'FROZEN',
        outcome: 'DISPUTED',
        revealDeadlineBlock: String(REVEAL_DEADLINE_BLOCK),
        arbitrationDeadlineBlock: String(ARBITRATION_DEADLINE_BLOCK),
        committedCount: 2,
        revealedCount: 2,
        approveCount: 1,
        denyCount: 1,
      }),
    ],
  })

beforeEach(() => {
  mockQuery.mockReset()
  refetchFn.mockReset()
  // The aim registry is module state shared by every surface, so one test's
  // offer would aim the next test's read.
  forgetAim({ safeTxHash: HASH, ...TARGET })
  forgetAim({ safeTxHash: HASH, ...UNRESOLVED })
  forgetAim({ safeTxHash: OTHER_HASH, ...TARGET })
})

describe('useSafenetCheck', () => {
  it('skips the query when no safeTxHash is given', () => {
    mockQuery.mockReturnValue(queryResult())

    renderHook(() => useSafenetCheck(undefined, null, TARGET))

    expect(lastOptions().skip).toBe(true)
  })

  describe('Safe context gating', () => {
    // useSafeInfo returns defaultSafeInfo before the Safe resolves, whose chain
    // id and address are both ''. Subscribing then would aim a read at nothing
    // and leave a second cache entry behind once the real Safe lands.
    it.each([
      ['no chain id', { chainId: '', safeAddress: TARGET.safeAddress }],
      ['no Safe address', { chainId: TARGET.chainId, safeAddress: '' }],
      ['neither', UNRESOLVED],
    ])('skips the query while the Safe context has %s', (_name, target) => {
      mockQuery.mockReturnValue(queryResult())

      renderHook(() => useSafenetCheck(HASH, null, target))

      expect(lastOptions().skip).toBe(true)
    })

    it('opens exactly one subscription, aimed at the resolved Safe', () => {
      mockQuery.mockReturnValue(queryResult())
      const { rerender } = renderHook(({ target }) => useSafenetCheck(HASH, null, target), {
        initialProps: { target: UNRESOLVED },
      })
      expect(lastOptions().skip).toBe(true)

      rerender({ target: TARGET })

      expect(lastOptions().skip).toBe(false)
      const subscribed = mockQuery.mock.calls.filter((call) => call[1].skip === false)
      expect(subscribed).toHaveLength(1)
      expect(subscribed[0][0]).toMatchObject(TARGET)
    })
  })

  describe('shared query identity', () => {
    const subscribedArgs = (hash: string, timestampMs: number | null, target = TARGET) => {
      mockQuery.mockClear()
      renderHook(() => useSafenetCheck(hash, timestampMs, target))
      return mockQuery.mock.calls[0][0]
    }

    beforeEach(() => {
      mockQuery.mockReturnValue(queryResult())
    })

    it('keys surfaces of one check on the same entry whatever submission time each offers', () => {
      const first = subscribedArgs(HASH, PROPOSED_AT)
      const second = subscribedArgs(HASH, LATER_OFFER)
      const third = subscribedArgs(HASH, null)

      expect(second).toEqual(first)
      expect(third).toEqual(first)
    })

    it.each([
      ['another transaction', OTHER_HASH, TARGET],
      ['another Safe', HASH, OTHER_SAFE],
    ])('keys %s on a different entry', (_name, hash, target) => {
      expect(subscribedArgs(hash, null, target)).not.toEqual(subscribedArgs(HASH, null))
    })
  })

  describe('block window aim', () => {
    it('offers the submission time to the registry instead of the query arguments', () => {
      mockQuery.mockReturnValue(queryResult())

      renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, TARGET))

      // The timestamp is not part of the check's identity, so it must not reach
      // the arguments the cache entry is keyed from.
      expect(mockQuery.mock.calls[0][0]).toEqual({ safeTxHash: HASH, ...TARGET })
      expect(resolveAim({ safeTxHash: HASH, ...TARGET })).toBe(PROPOSED_AT)
    })

    it('offers nothing while the Safe context is unresolved', () => {
      mockQuery.mockReturnValue(queryResult())

      renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, UNRESOLVED))

      expect(resolveAim({ safeTxHash: HASH, ...UNRESOLVED })).toBeNull()
    })

    it('re-aims the shared read exactly once when a surface knows an earlier time', () => {
      // One surface mounts first with a later surrogate and its read lands.
      // A second surface then mounts with the submission date.
      const aimedWorse = buildSnapshot({ safeTxHash: HASH, aimedAtMs: LATER_OFFER })
      mockQuery.mockReturnValue(queryResult({ data: aimedWorse }))
      const queueRow = renderHook(() => useSafenetCheck(HASH, LATER_OFFER, TARGET))
      expect(refetchFn).not.toHaveBeenCalled()

      const flow = renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, TARGET))

      expect(refetchFn).toHaveBeenCalledTimes(1)

      // The refetch puts the shared entry in flight, and that is what stops the
      // other surface stacking a second read on the same improved aim.
      mockQuery.mockReturnValue(queryResult({ data: aimedWorse, isFetching: true }))
      flow.rerender()
      queueRow.rerender()
      expect(refetchFn).toHaveBeenCalledTimes(1)

      // The re-aimed read lands and settles the loop.
      mockQuery.mockReturnValue(queryResult({ data: buildSnapshot({ safeTxHash: HASH, aimedAtMs: PROPOSED_AT }) }))
      flow.rerender()
      queueRow.rerender()

      expect(refetchFn).toHaveBeenCalledTimes(1)
    })

    it('never re-aims for a surface offering a later time', () => {
      mockQuery.mockReturnValue(queryResult({ data: buildSnapshot({ safeTxHash: HASH, aimedAtMs: PROPOSED_AT }) }))
      renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, TARGET))

      renderHook(() => useSafenetCheck(HASH, LATER_OFFER, TARGET))

      expect(refetchFn).not.toHaveBeenCalled()
      expect(resolveAim({ safeTxHash: HASH, ...TARGET })).toBe(PROPOSED_AT)
    })

    it('waits for the read in flight instead of stacking a second one', () => {
      recordAim({ safeTxHash: HASH, ...TARGET }, PROPOSED_AT)
      mockQuery.mockReturnValue(
        queryResult({ data: buildSnapshot({ safeTxHash: HASH, aimedAtMs: LATER_OFFER }), isFetching: true }),
      )

      renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, TARGET))

      expect(refetchFn).not.toHaveBeenCalled()
    })

    it('does not re-aim before the first read has produced a snapshot', () => {
      mockQuery.mockReturnValue(queryResult({ isLoading: true, isFetching: true }))

      renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, TARGET))

      expect(refetchFn).not.toHaveBeenCalled()
    })
  })

  describe('polling interval selection', () => {
    const polledAfter = (snapshot: SafenetCheckSnapshot, fulfilledTimeStamp: number) => {
      mockQuery.mockReturnValue(queryResult({ data: snapshot, fulfilledTimeStamp }))
    }

    it('polls a pending request fast through its reveal deadline and slowly after it', () => {
      polledAfter(pendingAt(REVEAL_DEADLINE_BLOCK), 1)
      const { rerender } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS)

      polledAfter(pendingAt(REVEAL_DEADLINE_BLOCK + 1), 2)
      rerender()

      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)
    })

    const AWAITING_CASES: Array<[string, AttestationVerificationStatus, CheckStatus]> = [
      ['unattested', AttestationVerificationStatus.UNVERIFIED, CheckStatus.IN_PROGRESS],
      ['attested with the group key pending', AttestationVerificationStatus.PENDING, CheckStatus.AWAITING_VERIFICATION],
    ]

    it.each(AWAITING_CASES)(
      'polls an approved request that is %s fast through the late window and slowly after it',
      (_name, verification, status) => {
        const lastFastBlock = REVEAL_DEADLINE_BLOCK + LATE_WINDOW_BLOCKS
        polledAfter(approvedAt(lastFastBlock, verification, status), 1)
        const { rerender } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
        expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS)

        polledAfter(approvedAt(lastFastBlock + 1, verification, status), 2)
        rerender()

        expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)
      },
    )

    it.each([
      ['before its reveal deadline', REVEAL_DEADLINE_BLOCK - 10],
      ['past its arbitration deadline', ARBITRATION_DEADLINE_BLOCK + 5_000],
    ])('polls a disputed request at the arbitration cadence %s', (_name, headBlock) => {
      polledAfter(disputedAt(headBlock), 1)

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(ARBITRATION_POLL_MS)
    })

    it('stops polling once the check is settled BENIGN, before any deadline has passed', () => {
      polledAfter(buildBenignSnapshot({ safeTxHash: HASH, headBlock: String(REVEAL_DEADLINE_BLOCK - 5) }), 1)

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(0)
    })
  })

  describe('unavailable grace window', () => {
    const SUBMITTED = 1_700_000_000_000

    afterEach(() => jest.useRealTimers())

    // A read aimed from the submission time that reached the head: the empty
    // result is the real "no check yet" the grace window exists for.
    const noCheck = () =>
      buildSnapshot({
        safeTxHash: HASH,
        status: CheckStatus.UNAVAILABLE,
        windowCoverage: 'proven',
        aimedAtMs: SUBMITTED,
      })

    it('keeps polling slowly while the check request may still be mining', () => {
      jest.useFakeTimers()
      jest.setSystemTime(SUBMITTED + 1_000)
      mockQuery.mockReturnValue(queryResult({ data: noCheck(), fulfilledTimeStamp: 1 }))

      renderHook(() => useSafenetCheck(HASH, SUBMITTED, TARGET))

      expect(lastOptions().pollingInterval).toBe(UNAVAILABLE_GRACE_POLL_MS)
    })

    it('stops polling once the grace window has closed', () => {
      jest.useFakeTimers()
      jest.setSystemTime(SUBMITTED + UNAVAILABLE_GRACE_MS)
      mockQuery.mockReturnValue(queryResult({ data: noCheck(), fulfilledTimeStamp: 1 }))

      renderHook(() => useSafenetCheck(HASH, SUBMITTED, TARGET))

      expect(lastOptions().pollingInterval).toBe(0)
    })

    it('re-evaluates the window against the clock of the latest landed poll', () => {
      // Without this the interval would keep the value the first read computed
      // and poll a check-less transaction forever.
      jest.useFakeTimers()
      jest.setSystemTime(SUBMITTED + 1_000)
      const snapshot = noCheck()
      mockQuery.mockReturnValue(queryResult({ data: snapshot, fulfilledTimeStamp: 1 }))
      const { rerender } = renderHook(() => useSafenetCheck(HASH, SUBMITTED, TARGET))
      expect(lastOptions().pollingInterval).toBe(UNAVAILABLE_GRACE_POLL_MS)

      jest.setSystemTime(SUBMITTED + UNAVAILABLE_GRACE_MS)
      mockQuery.mockReturnValue(queryResult({ data: snapshot, fulfilledTimeStamp: 2 }))
      rerender()

      expect(lastOptions().pollingInterval).toBe(0)
    })

    it('anchors the window on the earliest offer, not this surface`s', () => {
      // The queue row offers a timestamp one hour later than the proposal. Read
      // from that offer the window would still be open; from the proposal it
      // closed long ago.
      jest.useFakeTimers()
      jest.setSystemTime(LATER_OFFER + 1_000)
      recordAim({ safeTxHash: HASH, ...TARGET }, PROPOSED_AT)
      mockQuery.mockReturnValue(
        queryResult({
          data: buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE, aimedAtMs: PROPOSED_AT }),
          fulfilledTimeStamp: 1,
        }),
      )

      renderHook(() => useSafenetCheck(HASH, LATER_OFFER, TARGET))

      expect(lastOptions().pollingInterval).toBe(0)
    })

    it('picks the check up at the fast cadence when it lands inside the window', () => {
      jest.useFakeTimers()
      jest.setSystemTime(SUBMITTED + 1_000)
      mockQuery.mockReturnValue(queryResult({ data: noCheck(), fulfilledTimeStamp: 1 }))
      const { result, rerender } = renderHook(() => useSafenetCheck(HASH, SUBMITTED, TARGET))
      expect(result.current.unavailableReason).toBe('NO_CHECK')
      // The cadence that gets the check picked up at all: without it the read
      // below never happens and NO_CHECK stays for the session.
      expect(lastOptions().pollingInterval).toBe(UNAVAILABLE_GRACE_POLL_MS)

      mockQuery.mockReturnValue(
        queryResult({ data: { ...pendingAt(REVEAL_DEADLINE_BLOCK), aimedAtMs: SUBMITTED }, fulfilledTimeStamp: 2 }),
      )
      rerender()

      expect(result.current.unavailableReason).toBeUndefined()
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS)
    })
  })

  describe('failed polls', () => {
    const failedPollCases: Array<[string, () => SafenetCheckSnapshot | undefined]> = [
      ['no snapshot', () => undefined],
      ['a settled snapshot', () => buildBenignSnapshot({ safeTxHash: HASH })],
    ]

    it('maps an error with no snapshot to UNAVAILABLE and does not call it stale', () => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.publicStatus).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.isStale).toBe(false)
    })

    // A transient endpoint failure must not read as a settled check and stop
    // polling: on mobile this retry is the only recovery path.
    it.each(failedPollCases)('retries at the slow cadence over %s', (_name, retained) => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: retained() }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)
    })

    // RTK Query flips isError off during a retry's pending phase but retains
    // `error`; keying on isError advertised interval 0 mid-retry.
    it.each(failedPollCases)('holds the slow cadence while a retry over %s is in flight', (_name, retained) => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, isError: false, isFetching: true, data: retained() }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)
    })

    it('keeps the last snapshot and flags isStale on an error with retained data', () => {
      const snapshot = buildBenignSnapshot({ safeTxHash: HASH })
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: snapshot }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.BENIGN)
      expect(result.current.isStale).toBe(true)
      expect(result.current.snapshot).toBe(snapshot)
    })

    it('recovers once a retry succeeds: fresh snapshot, no longer stale, computed interval restored', () => {
      const retained = pendingAt(REVEAL_DEADLINE_BLOCK)
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: retained, fulfilledTimeStamp: 1 }))
      const { result, rerender } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
      expect(result.current.isStale).toBe(true)
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)

      const recovered = approvedAt(
        REVEAL_DEADLINE_BLOCK + 1,
        AttestationVerificationStatus.UNVERIFIED,
        CheckStatus.IN_PROGRESS,
      )
      mockQuery.mockReturnValue(queryResult({ data: recovered, fulfilledTimeStamp: 2 }))
      rerender()

      expect(result.current.isStale).toBe(false)
      expect(result.current.snapshot).toBe(recovered)
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS)
    })
  })

  describe('status', () => {
    it.each([
      [CheckStatus.SUBMITTED, CheckStatus.SUBMITTED],
      [CheckStatus.IN_PROGRESS, CheckStatus.IN_PROGRESS],
      [CheckStatus.AWAITING_VERIFICATION, CheckStatus.IN_PROGRESS],
      [CheckStatus.VERIFICATION_FAILED, CheckStatus.TIMED_OUT],
      [CheckStatus.BENIGN, CheckStatus.BENIGN],
      [CheckStatus.MALICIOUS, CheckStatus.MALICIOUS],
      [CheckStatus.TIMED_OUT, CheckStatus.TIMED_OUT],
      [CheckStatus.UNAVAILABLE, CheckStatus.UNAVAILABLE],
    ])('reports a %s snapshot as %s publicly', (status, publicStatus) => {
      mockQuery.mockReturnValue(queryResult({ data: buildSnapshot({ safeTxHash: HASH, status }) }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(status)
      expect(result.current.publicStatus).toBe(publicStatus)
    })

    it('is UNAVAILABLE before any snapshot exists', () => {
      mockQuery.mockReturnValue(queryResult())

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.publicStatus).toBe(CheckStatus.UNAVAILABLE)
    })

    it('follows a later snapshot down as readily as up, with no verdict held over', () => {
      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }), fulfilledTimeStamp: 1 }))
      const { result, rerender } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
      expect(result.current.status).toBe(CheckStatus.BENIGN)

      const reorged = pendingAt(REVEAL_DEADLINE_BLOCK)
      mockQuery.mockReturnValue(queryResult({ data: reorged, fulfilledTimeStamp: 2 }))
      rerender()

      expect(result.current.snapshot).toBe(reorged)
      expect(result.current.status).toBe(CheckStatus.SUBMITTED)
      expect(result.current.publicStatus).toBe(CheckStatus.SUBMITTED)
    })
  })

  describe('unavailable reason', () => {
    const emptyRead = (windowCoverage: WindowCoverage) =>
      buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE, outcome: null, windowCoverage })

    const rulingRead = (outcome: RulingOutcome, windowCoverage: WindowCoverage) => {
      const request = buildRequestSnapshot({
        state: outcome === 'RULED_SECURE' ? 'RESOLVED_APPROVED' : 'TIMED_OUT',
        outcome,
        committedCount: 2,
        revealedCount: 2,
        approveCount: 1,
        denyCount: 1,
      })
      return buildSnapshot({
        safeTxHash: HASH,
        status: CheckStatus.UNAVAILABLE,
        outcome,
        requestId: request.requestId,
        requests: [request],
        windowCoverage,
      })
    }

    const RULING_READS: Array<[RulingOutcome, WindowCoverage]> = [
      ['RULED_SECURE', 'proven'],
      ['RULED_SECURE', 'heuristic'],
      ['NO_RULING', 'proven'],
      ['NO_RULING', 'heuristic'],
    ]

    it('reports NO_CHECK when a window covering the whole lifetime found nothing', () => {
      mockQuery.mockReturnValue(queryResult({ data: emptyRead('proven') }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBe('NO_CHECK')
    })

    it('reports WINDOW_UNCERTAIN when the empty read cannot support the claim', () => {
      // The window was head-relative, mis-estimated, or ended short of the head.
      // Nothing found there is not the same statement as nothing existing.
      mockQuery.mockReturnValue(queryResult({ data: emptyRead('heuristic') }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBe('WINDOW_UNCERTAIN')
    })

    it('reports READ_FAILED when the read failed with nothing to show', () => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBe('READ_FAILED')
    })

    it.each(['proven', 'heuristic'] as const)(
      'keeps the retained %s-window snapshot`s reason when a refetch fails over it',
      (coverage) => {
        mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: emptyRead(coverage) }))

        const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

        expect(result.current.unavailableReason).toBe(coverage === 'proven' ? 'NO_CHECK' : 'WINDOW_UNCERTAIN')
      },
    )

    it.each(RULING_READS)('reports no reason for a %s ruling read over a %s window', (outcome, coverage) => {
      mockQuery.mockReturnValue(queryResult({ data: rulingRead(outcome, coverage) }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.unavailableReason).toBeUndefined()
    })

    it.each(['RULED_SECURE', 'NO_RULING'] as const)(
      'never turns a retained %s ruling into a failed read when a refetch fails over it',
      (outcome) => {
        mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: rulingRead(outcome, 'proven') }))

        const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

        expect(result.current.isStale).toBe(true)
        expect(result.current.unavailableReason).toBeUndefined()
      },
    )

    it.each([
      ['a settled BENIGN check', () => buildBenignSnapshot({ safeTxHash: HASH }), undefined],
      ['a check in progress over a heuristic window', () => pendingAt(REVEAL_DEADLINE_BLOCK), undefined],
      ['a retained check in progress after a failed refetch', () => pendingAt(REVEAL_DEADLINE_BLOCK), FETCH_ERROR],
    ])('reports no reason once a check is observed: %s', (_name, snapshot, error) => {
      mockQuery.mockReturnValue(queryResult({ data: snapshot(), error }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBeUndefined()
    })
  })

  describe('loading', () => {
    it('presents the empty view, with no reason, while the first read is in flight', () => {
      mockQuery.mockReturnValue(queryResult({ isLoading: true, isFetching: true }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current).toEqual(
        buildCheckView({ isLoading: true, isFetching: true, refetch: result.current.refetch }),
      )
    })

    it('keeps the snapshot on show, and not loading, while a refetch is in flight', () => {
      const snapshot = buildBenignSnapshot({ safeTxHash: HASH })
      mockQuery.mockReturnValue(queryResult({ data: snapshot, isFetching: true }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isFetching).toBe(true)
      expect(result.current.snapshot).toBe(snapshot)
      expect(result.current.status).toBe(CheckStatus.BENIGN)
    })
  })

  it('exposes refetch that re-runs the query', () => {
    mockQuery.mockReturnValue(queryResult({ data: buildSnapshot({ safeTxHash: HASH }) }))

    const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
    result.current.refetch()

    expect(refetchFn).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['no safeTxHash', undefined, TARGET],
    ['an unresolved Safe', HASH, UNRESOLVED],
  ])('does not call refetch on a query skipped for %s', (_name, hash, target) => {
    mockQuery.mockReturnValue(queryResult())

    const { result } = renderHook(() => useSafenetCheck(hash, null, target))
    result.current.refetch()

    expect(refetchFn).not.toHaveBeenCalled()
  })
})
