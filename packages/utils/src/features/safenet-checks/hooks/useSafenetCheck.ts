import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { selectPinnedVerdict, type SafenetCheckPartialState } from '@safe-global/store/safenet/safenetCheckSlice'
import { POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../constants'
import { CheckStatus, toPublicStatus, type PublicCheckStatus, type UnavailableReason } from '../types/status'
import type { SafenetCheckSnapshot } from '../types/snapshot'
import { computePollingInterval } from '../utils/computePollingInterval'
import type { CheckTarget } from '../utils/attestations'
import { mergeMonotonic } from '../utils/mergeMonotonic'

export type SafenetCheckView = {
  /** The last good snapshot; retained across a failed refetch (see `isStale`). */
  snapshot: SafenetCheckSnapshot | undefined
  /** Internal merged status. Can be `AWAITING_VERIFICATION` or `VERIFICATION_FAILED`. */
  status: CheckStatus
  publicStatus: PublicCheckStatus
  /**
   * Set only while the merged status is `UNAVAILABLE`: `NO_CHECK` when a
   * snapshot says no check was ever requested, `READ_FAILED` when the read
   * itself failed. `undefined` before the first read resolves.
   */
  unavailableReason: UnavailableReason | undefined
  isLoading: boolean
  isFetching: boolean
  /** Showing a retained snapshot because the latest fetch failed. */
  isStale: boolean
  refetch: () => void
}

/**
 * Subscribe to a check's chain-read lifecycle for a `safeTxHash`. Wraps the
 * store's `getSafenetCheck` query with the dynamic poll interval, the merge
 * against the session-pinned verdict, and the stale/UNAVAILABLE error mapping.
 * Platform-neutral (no DOM access). `target` is the Safe being viewed, which
 * every attestation must name. `timestampMs` aims the reader's block window and
 * anchors the UNAVAILABLE grace window; pass the submission time when known.
 * Callers sharing one check must agree on supplying it — the cache keys by Safe
 * and hash, and the last fetch's args aim every later poll.
 */
export const useSafenetCheck = (
  safeTxHash: string | undefined,
  timestampMs: number | null | undefined,
  target: CheckTarget,
): SafenetCheckView => {
  const skip = !safeTxHash

  // The interval feeds back into the query below, so the (status → interval →
  // next poll) loop is reconfigured from the query's own output via an effect.
  const [pollingInterval, setPollingInterval] = useState(POLL_INTERVAL_FAST_MS)

  const query = useGetSafenetCheckQuery(
    { safeTxHash: safeTxHash ?? '', timestampMs: timestampMs ?? null, ...target },
    {
      skip,
      pollingInterval,
      // No refetchOnFocus: a settled check does not change, and a history page
      // would cost ~3 chain reads per row on every tab switch back.
      skipPollingIfUnfocused: true,
    },
  )

  const pinned = useSelector((state: SafenetCheckPartialState) =>
    safeTxHash ? selectPinnedVerdict(state, safeTxHash) : undefined,
  )

  const snapshot = query.data
  const hasData = snapshot !== undefined
  // Keyed on the retained error, not `isError`: RTK Query flips `isError` off
  // during each retry's pending phase while `error` and `data` persist.
  const hasError = query.error !== undefined
  const isStale = hasError && hasData

  // With no snapshot to show the base is UNAVAILABLE; the monotonic merge
  // still keeps any pinned floor from an earlier success.
  const base = snapshot?.status ?? CheckStatus.UNAVAILABLE
  const status = mergeMonotonic(pinned?.status, base)
  const publicStatus = toPublicStatus(status)

  // A snapshot outranks the error: an error over retained data is a failed
  // refetch (isStale), and the retained snapshot is still what we know.
  const unavailableReason: UnavailableReason | undefined =
    status !== CheckStatus.UNAVAILABLE ? undefined : hasData ? 'NO_CHECK' : hasError ? 'READ_FAILED' : undefined

  // Events are sorted ascending, so [0] substitutes for the deadline on the
  // plain path, which does not emit one.
  const firstEventBlock = snapshot?.events[0] !== undefined ? String(snapshot.events[0].blockNumber) : null

  // A landed poll re-runs this, so the grace window below is re-evaluated
  // against a fresh clock instead of the one from the first read.
  const fulfilledAt = query.fulfilledTimeStamp

  useEffect(() => {
    // A failed fetch with nothing to show is a transient endpoint problem, not
    // "no check exists" — keep retrying at the slow cadence. This is the only
    // recovery path on mobile, which has no focus-refetch listeners.
    if (hasError && !hasData) {
      setPollingInterval(POLL_INTERVAL_LATE_MS)
      return
    }
    setPollingInterval(
      computePollingInterval({
        status,
        headBlock: snapshot?.headBlock ?? null,
        deadlineBlock: snapshot?.deadlineBlock ?? null,
        firstEventBlock,
        submittedAtMs: timestampMs ?? null,
        nowMs: Date.now(),
      }),
    )
  }, [
    hasError,
    hasData,
    status,
    snapshot?.headBlock,
    snapshot?.deadlineBlock,
    firstEventBlock,
    timestampMs,
    fulfilledAt,
  ])

  const { refetch: queryRefetch } = query
  const refetch = useCallback(() => {
    if (!skip) queryRefetch()
  }, [skip, queryRefetch])

  return {
    snapshot,
    status,
    publicStatus,
    unavailableReason,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isStale,
    refetch,
  }
}
