import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { selectPinnedVerdict, type SafenetCheckPartialState } from '@safe-global/store/safenet/safenetCheckSlice'
import { recordAim } from '@safe-global/store/safenet/safenetAimRegistry'
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
   * Set only while the merged status is `UNAVAILABLE` — see
   * {@link UnavailableReason}. `undefined` before the first read resolves.
   */
  unavailableReason: UnavailableReason | undefined
  isLoading: boolean
  isFetching: boolean
  /** Showing a retained snapshot because the latest fetch failed. */
  isStale: boolean
  refetch: () => void
}

/**
 * Which `UNAVAILABLE` a resolved read means. `NO_CHECK` is a factual claim
 * about the chain, so only a window that covers the check's whole possible
 * lifetime licenses it; over any other window the read found nothing where it
 * looked, which is a weaker statement. A snapshot outranks the error: an error
 * over retained data is a failed refetch, and the snapshot is still what we know.
 */
const resolveUnavailableReason = (
  snapshot: SafenetCheckSnapshot | undefined,
  hasError: boolean,
): UnavailableReason | undefined => {
  if (snapshot !== undefined) return snapshot.windowCoverage === 'proven' ? 'NO_CHECK' : 'WINDOW_UNCERTAIN'
  return hasError ? 'READ_FAILED' : undefined
}

/**
 * Subscribe to a check's chain-read lifecycle for a `safeTxHash`. Wraps the
 * store's `getSafenetCheck` query with the dynamic poll interval, the merge
 * against the session-pinned verdict, and the stale/UNAVAILABLE error mapping.
 * Platform-neutral (no DOM access). `target` is the Safe being viewed, which
 * every attestation must name. `timestampMs` is this surface's idea of the
 * submission time: it is offered to the aim registry, which keeps the earliest
 * offer and aims every read of this check with it. Surfaces therefore need not
 * agree — a surface offering an earlier time re-aims the shared read once, and
 * a later one changes nothing.
 */
export const useSafenetCheck = (
  safeTxHash: string | undefined,
  timestampMs: number | null | undefined,
  target: CheckTarget,
): SafenetCheckView => {
  // A check's identity is the Safe plus the hash, so a target that has not
  // resolved yet is not a subscription worth opening: it would read an empty
  // block window and, once the real Safe lands, leave a second cache entry and
  // a second poll loop behind.
  const skip = !safeTxHash || !target.chainId || !target.safeAddress
  const identity = { safeTxHash: safeTxHash ?? '', ...target }

  // Offered during render, so the aim is in place before the query hook's
  // subscription effect fires the first read. Repeating it is free and a render
  // React discards costs nothing: the registry keeps the minimum of all offers.
  const aim = skip ? null : recordAim(identity, timestampMs)

  // The interval feeds back into the query below, so the (status → interval →
  // next poll) loop is reconfigured from the query's own output via an effect.
  const [pollingInterval, setPollingInterval] = useState(POLL_INTERVAL_FAST_MS)

  const query = useGetSafenetCheckQuery(identity, {
    skip,
    pollingInterval,
    // No refetchOnFocus: a settled check does not change, and a history page
    // would cost ~3 chain reads per row on every tab switch back.
    skipPollingIfUnfocused: true,
  })

  const pinned = useSelector((state: SafenetCheckPartialState) =>
    safeTxHash && !skip ? selectPinnedVerdict(state, { safeTxHash, ...target }) : undefined,
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

  const unavailableReason =
    status !== CheckStatus.UNAVAILABLE ? undefined : resolveUnavailableReason(snapshot, hasError)

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
        submittedAtMs: aim,
        attestedAtMs: snapshot?.attestedAtMs ?? null,
        nowMs: Date.now(),
      }),
    )
  }, [
    hasError,
    hasData,
    status,
    snapshot?.headBlock,
    snapshot?.deadlineBlock,
    snapshot?.attestedAtMs,
    firstEventBlock,
    aim,
    fulfilledAt,
  ])

  const { refetch: queryRefetch } = query

  // This surface offered a better aim than the snapshot was read with, so
  // re-aim the shared entry. Exactly one refetch: the aim moves only when a
  // surface offers an earlier time, and the refetch equalises the two.
  useEffect(() => {
    if (skip || query.isFetching || snapshot === undefined) return
    if (snapshot.aimedAtMs !== aim) queryRefetch()
  }, [skip, query.isFetching, snapshot, aim, queryRefetch])

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
