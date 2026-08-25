import { renderHook } from '@testing-library/react'
import { useSelector } from 'react-redux'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import type { PinnedVerdict } from '@safe-global/store/safenet/safenetCheckSlice'
import { useSafenetCheck } from '../useSafenetCheck'
import {
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
})

describe('useSafenetCheck', () => {
  it('skips the query when no safeTxHash is given', () => {
    mockQuery.mockReturnValue(queryResult())

    renderHook(() => useSafenetCheck(undefined, null, TARGET))

    expect(mockQuery.mock.calls[0][0]).toEqual({ safeTxHash: '', timestampMs: null, ...TARGET })
    expect(mockQuery.mock.calls[0][1]).toMatchObject({ skip: true })
  })

  it('passes the transaction timestamp through so the reader can target its block window', () => {
    mockQuery.mockReturnValue(queryResult())

    renderHook(() => useSafenetCheck('0xabc', 1_700_000_000_000, TARGET))

    expect(mockQuery.mock.calls[0][0]).toEqual({ safeTxHash: '0xabc', timestampMs: 1_700_000_000_000, ...TARGET })
  })

  describe('polling interval selection', () => {
    it('stops polling once a verdict is verified BENIGN, and skips polling while unfocused', () => {
      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }) }))

      renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(lastOptions().pollingInterval).toBe(0)
      // The one deliberate option keeping background tabs off the chain.
      expect(lastOptions().skipPollingIfUnfocused).toBe(true)
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

    const noCheck = () => buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE })

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
    it('reports NO_CHECK when a snapshot says no check was ever requested', () => {
      mockQuery.mockReturnValue(
        queryResult({ data: buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE }) }),
      )

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBe('NO_CHECK')
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

    it('keeps the retained snapshot as NO_CHECK when a refetch fails over it', () => {
      mockQuery.mockReturnValue(
        queryResult({
          error: FETCH_ERROR,
          data: buildSnapshot({ safeTxHash: HASH, status: CheckStatus.UNAVAILABLE }),
        }),
      )

      const { result } = renderHook(() => useSafenetCheck(HASH, null, TARGET))

      expect(result.current.unavailableReason).toBe('NO_CHECK')
    })

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
