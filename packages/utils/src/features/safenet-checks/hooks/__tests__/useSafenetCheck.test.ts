import { renderHook } from '@testing-library/react'
import { useSelector } from 'react-redux'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import type { PinnedVerdict } from '@safe-global/store/safenet/safenetCheckSlice'
import { forgetAim, recordAim, resolveAim } from '@safe-global/store/safenet/safenetAimRegistry'
import { useSafenetCheck } from '../useSafenetCheck'
import {
  ARBITRATION_POLL_MS,
  ARBITRATION_WINDOW_MS,
  POLL_INTERVAL_FAST_MS,
  POLL_INTERVAL_LATE_MS,
  UNAVAILABLE_GRACE_MS,
  UNAVAILABLE_GRACE_POLL_MS,
} from '../../constants'
import { CheckStatus, UNVERIFIED_ATTESTATION, type SafenetCheckSnapshot } from '../../types'
import { buildBenignSnapshot, buildSnapshot, plainProposedEvent } from '../../builders'

jest.mock('@safe-global/store/safenet/safenetCheckApi', () => ({
  useGetSafenetCheckQuery: jest.fn(),
}))
jest.mock('react-redux', () => ({ useSelector: jest.fn() }))

const mockQuery = useGetSafenetCheckQuery as unknown as jest.Mock
const mockSelector = useSelector as unknown as jest.Mock

const HASH = ('0x' + 'ab'.repeat(32)) as `0x${string}`
const TARGET = { chainId: '100', safeAddress: '0x0000000000000000000000000000000000000abc' }
const OTHER_HASH = ('0x' + 'cd'.repeat(32)) as `0x${string}`
/** A transaction's submission date, and a later surrogate a surface might offer. */
const PROPOSED_AT = 1_700_000_000_000
const LATER_OFFER = PROPOSED_AT + 3_600_000

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

beforeEach(() => {
  mockQuery.mockReset()
  mockSelector.mockReset()
  refetchFn.mockReset()
  mockSelector.mockReturnValue(undefined)
  // The aim registry is module state shared by every surface, so one test's
  // offer would aim the next test's read.
  forgetAim({ safeTxHash: HASH, ...TARGET })
  forgetAim({ safeTxHash: OTHER_HASH, ...TARGET })
})

describe('useSafenetCheck', () => {
  it('skips the query when no safeTxHash is given', () => {
    mockQuery.mockReturnValue(queryResult())

    renderHook(() => useSafenetCheck(undefined, null, TARGET))

    expect(mockQuery.mock.calls[0][0]).toEqual({ safeTxHash: '', ...TARGET })
    expect(mockQuery.mock.calls[0][1]).toMatchObject({ skip: true })
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

      renderHook(() => useSafenetCheck(HASH, PROPOSED_AT, { chainId: '', safeAddress: '' }))

      expect(resolveAim({ safeTxHash: HASH, ...TARGET })).toBeNull()
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

    it('anchors the UNAVAILABLE grace window on the earliest offer, not this surface`s', () => {
      jest.useFakeTimers()
      // The queue row offers a timestamp one hour later than the proposal. The
      // grace window is 10 minutes wide, so aiming it at the summary timestamp
      // would keep polling a check-less transaction an hour past its close.
      jest.setSystemTime(PROPOSED_AT + UNAVAILABLE_GRACE_MS + 1_000)
      recordAim({ safeTxHash: HASH, ...TARGET }, PROPOSED_AT)
      mockQuery.mockReturnValue(
        queryResult({
          data: buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE, aimedAtMs: PROPOSED_AT }),
          fulfilledTimeStamp: 1,
        }),
      )

      renderHook(() => useSafenetCheck(HASH, LATER_OFFER, TARGET))

      expect(lastOptions().pollingInterval).toBe(0)
      jest.useRealTimers()
    })
  })

  describe('Safe context gating', () => {
    // useSafeInfo returns defaultSafeInfo before the Safe resolves, whose chain
    // id and address are both ''. Subscribing then would aim a read at nothing
    // and leave a second cache entry behind once the real Safe lands.
    const UNRESOLVED = { chainId: '', safeAddress: '' }

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

    it('never reads a pinned verdict for an unresolved Safe', () => {
      mockQuery.mockReturnValue(queryResult())

      renderHook(() => useSafenetCheck(HASH, null, UNRESOLVED))

      // The selector must not fall back to a hash-only lookup.
      expect(mockSelector.mock.results[0].value).toBeUndefined()
    })
  })

  describe('polling interval selection', () => {
    const ATTESTED = 1_785_749_985_000

    afterEach(() => jest.useRealTimers())

    it('polls slowly on a verified BENIGN inside the arbitration window, unfocused tabs excepted', () => {
      jest.useFakeTimers()
      jest.setSystemTime(ATTESTED + 60_000)
      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }) }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(ARBITRATION_POLL_MS)
      // The one deliberate option keeping background tabs off the chain.
      expect(lastOptions().skipPollingIfUnfocused).toBe(true)
    })

    it('stops polling once the arbitration window has closed', () => {
      jest.useFakeTimers()
      jest.setSystemTime(ATTESTED + ARBITRATION_WINDOW_MS)
      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }) }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(0)
    })

    // The plain (non-oracle) path never emits a deadline — the hook substitutes
    // the first observed event's block, so a never-attested check still stops.
    it('polls fast on the plain path while inside the substitute deadline', () => {
      mockQuery.mockReturnValue(
        queryResult({
          data: buildSnapshot({
            status: CheckStatus.SUBMITTED,
            headBlock: '150',
            deadlineBlock: null,
            events: [plainProposedEvent({ blockNumber: 100 })],
          }),
        }),
      )

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS)
    })
  })

  describe('unavailable grace window', () => {
    const SUBMITTED = 1_700_000_000_000

    afterEach(() => jest.useRealTimers())

    // A read aimed from the submission time that reached the head: the empty
    // result is the real "no check yet" the grace window exists for.
    const noCheck = () => buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE, windowCoverage: 'proven' })

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

    it('picks the check up at the fast cadence when it lands inside the window', () => {
      jest.useFakeTimers()
      jest.setSystemTime(SUBMITTED + 1_000)
      mockQuery.mockReturnValue(queryResult({ data: noCheck(), fulfilledTimeStamp: 1 }))
      const { result, rerender } = renderHook(() => useSafenetCheck(HASH, SUBMITTED, TARGET))
      expect(result.current.unavailableReason).toBe('NO_CHECK')
      // The cadence that gets the check picked up at all: without it the read
      // below never happens and NO_CHECK stays pinned for the session.
      expect(lastOptions().pollingInterval).toBe(UNAVAILABLE_GRACE_POLL_MS)

      mockQuery.mockReturnValue(
        queryResult({
          data: buildSnapshot({
            safeTxHash: HASH,
            status: CheckStatus.SUBMITTED,
            headBlock: '150',
            deadlineBlock: null,
            events: [plainProposedEvent({ blockNumber: 100 })],
          }),
          fulfilledTimeStamp: 2,
        }),
      )
      rerender()

      expect(result.current.unavailableReason).toBeUndefined()
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS)
    })
  })

  describe('error mapping', () => {
    it('maps an error with no data to UNAVAILABLE', () => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.publicStatus).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.isStale).toBe(false)
    })

    it('keeps retrying at the slow cadence when the first fetch failed (nothing to show)', () => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      // A transient endpoint failure must not read as "no check exists" and
      // stop polling — on mobile this retry is the only recovery path.
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)
    })

    it('holds the slow cadence while a retry is in flight (error retained, request pending)', () => {
      // RTK Query flips isError off during a retry's pending phase but retains
      // `error`; keying on isError here advertised interval 0 mid-retry.
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, isError: false, isFetching: true }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)
    })

    it('restores the computed interval once a retry succeeds', () => {
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR }))
      const { rerender } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
      expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS)

      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }) }))
      rerender()

      expect(lastOptions().pollingInterval).toBe(0)
    })

    it('keeps the last snapshot and flags isStale on an error with retained data', () => {
      const snapshot = buildBenignSnapshot({ safeTxHash: HASH })
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: snapshot }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.BENIGN)
      expect(result.current.isStale).toBe(true)
      expect(result.current.snapshot).toBe(snapshot)
    })
  })

  describe('unavailable reason', () => {
    const emptyRead = (windowCoverage: 'proven' | 'heuristic') =>
      buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE, windowCoverage })

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

    it('never reports READ_FAILED while the first read is in flight', () => {
      mockQuery.mockReturnValue(queryResult({ isLoading: true, isFetching: true }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.unavailableReason).toBeUndefined()
    })

    it.each(['proven', 'heuristic'] as const)(
      'keeps the retained %s-window snapshot`s reason when a refetch fails over it',
      (coverage) => {
        mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR, data: emptyRead(coverage) }))

        const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

        expect(result.current.unavailableReason).toBe(coverage === 'proven' ? 'NO_CHECK' : 'WINDOW_UNCERTAIN')
      },
    )

    it('reports no reason once a check is observed', () => {
      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }) }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBeUndefined()
    })
  })

  describe('read-path pin merge', () => {
    it('never downgrades below the pinned verdict', () => {
      const pinned: PinnedVerdict = { status: CheckStatus.BENIGN, atBlock: '10', verification: UNVERIFIED_ATTESTATION }
      mockSelector.mockReturnValue(pinned)
      // A reorg drops the attestation and the fresh read derives IN_PROGRESS.
      mockQuery.mockReturnValue(
        queryResult({ data: buildSnapshot({ status: CheckStatus.IN_PROGRESS, safeTxHash: HASH }) }),
      )

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.BENIGN)
      expect(result.current.publicStatus).toBe(CheckStatus.BENIGN)
    })

    it('keeps the pinned verdict through a transient UNAVAILABLE', () => {
      const pinned: PinnedVerdict = {
        status: CheckStatus.MALICIOUS,
        atBlock: '10',
        verification: UNVERIFIED_ATTESTATION,
      }
      mockSelector.mockReturnValue(pinned)
      mockQuery.mockReturnValue(queryResult({ error: FETCH_ERROR }))

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.status).toBe(CheckStatus.MALICIOUS)
    })
  })

  it('exposes refetch that re-runs the query', () => {
    mockQuery.mockReturnValue(queryResult({ data: buildSnapshot({ safeTxHash: HASH }) }))

    const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))
    result.current.refetch()

    expect(refetchFn).toHaveBeenCalledTimes(1)
  })

  it('does not call refetch on a skipped query', () => {
    mockQuery.mockReturnValue(queryResult())

    const { result } = renderHook(() => useSafenetCheck(undefined, null, TARGET))
    result.current.refetch()

    expect(refetchFn).not.toHaveBeenCalled()
  })
})
