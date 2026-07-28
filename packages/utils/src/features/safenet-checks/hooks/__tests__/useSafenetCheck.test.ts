import { renderHook, waitFor } from '@testing-library/react'
import { useSelector } from 'react-redux'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import type { PinnedVerdict } from '@safe-global/store/safenet/safenetCheckSlice'
import { useSafenetCheck } from '../useSafenetCheck'
import { POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../../constants'
import { CheckStatus, UNVERIFIED_ATTESTATION } from '../../types'
import { buildBenignSnapshot, buildSnapshot } from '../../builders'

jest.mock('@safe-global/store/safenet/safenetCheckApi', () => ({
  useGetSafenetCheckQuery: jest.fn(),
}))
jest.mock('react-redux', () => ({ useSelector: jest.fn() }))

const mockQuery = useGetSafenetCheckQuery as unknown as jest.Mock
const mockSelector = useSelector as unknown as jest.Mock

const HASH = ('0x' + 'ab'.repeat(32)) as `0x${string}`

type QueryResult = Partial<ReturnType<typeof useGetSafenetCheckQuery>>

const refetchFn = jest.fn()

const queryResult = (over: QueryResult = {}): QueryResult => ({
  data: undefined,
  isError: false,
  isLoading: false,
  isFetching: false,
  refetch: refetchFn,
  ...over,
})

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

    renderHook(() => useSafenetCheck(undefined))

    expect(mockQuery.mock.calls[0][0]).toEqual({ safeTxHash: '', timestampMs: null })
    expect(mockQuery.mock.calls[0][1]).toMatchObject({ skip: true })
  })

  it('passes the transaction timestamp through so the reader can target its block window', () => {
    mockQuery.mockReturnValue(queryResult())

    renderHook(() => useSafenetCheck('0xabc', 1_700_000_000_000))

    expect(mockQuery.mock.calls[0][0]).toEqual({ safeTxHash: '0xabc', timestampMs: 1_700_000_000_000 })
  })

  describe('polling interval selection', () => {
    it('polls fast before the deadline', async () => {
      mockQuery.mockReturnValue(
        queryResult({
          data: buildSnapshot({ status: CheckStatus.IN_PROGRESS, headBlock: '100', deadlineBlock: '200' }),
        }),
      )

      renderHook(() => useSafenetCheck(HASH))

      await waitFor(() => expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_FAST_MS))
    })

    it('polls slowly inside the late window', async () => {
      mockQuery.mockReturnValue(
        queryResult({
          data: buildSnapshot({ status: CheckStatus.IN_PROGRESS, headBlock: '300', deadlineBlock: '200' }),
        }),
      )

      renderHook(() => useSafenetCheck(HASH))

      await waitFor(() => expect(lastOptions().pollingInterval).toBe(POLL_INTERVAL_LATE_MS))
    })

    it('stops polling once a verdict is verified BENIGN', async () => {
      mockQuery.mockReturnValue(queryResult({ data: buildBenignSnapshot({ safeTxHash: HASH }) }))

      renderHook(() => useSafenetCheck(HASH))

      await waitFor(() => expect(lastOptions().pollingInterval).toBe(0))
    })
  })

  describe('error mapping', () => {
    it('maps an error with no data to UNAVAILABLE', () => {
      mockQuery.mockReturnValue(queryResult({ isError: true, data: undefined }))

      const { result } = renderHook(() => useSafenetCheck(HASH))

      expect(result.current.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.publicStatus).toBe(CheckStatus.UNAVAILABLE)
      expect(result.current.isStale).toBe(false)
    })

    it('keeps the last snapshot and flags isStale on an error with retained data', () => {
      const snapshot = buildBenignSnapshot({ safeTxHash: HASH })
      mockQuery.mockReturnValue(queryResult({ isError: true, data: snapshot }))

      const { result } = renderHook(() => useSafenetCheck(HASH))

      expect(result.current.status).toBe(CheckStatus.BENIGN)
      expect(result.current.isStale).toBe(true)
      expect(result.current.snapshot).toBe(snapshot)
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

      const { result } = renderHook(() => useSafenetCheck(HASH))

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
      mockQuery.mockReturnValue(queryResult({ isError: true, data: undefined }))

      const { result } = renderHook(() => useSafenetCheck(HASH))

      expect(result.current.status).toBe(CheckStatus.MALICIOUS)
    })
  })

  it('exposes refetch that re-runs the query', () => {
    mockQuery.mockReturnValue(queryResult({ data: buildSnapshot({ safeTxHash: HASH }) }))

    const { result } = renderHook(() => useSafenetCheck(HASH))
    result.current.refetch()

    expect(refetchFn).toHaveBeenCalledTimes(1)
  })
})
