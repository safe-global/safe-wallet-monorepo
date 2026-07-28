import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { selectPinnedVerdict, type SafenetCheckPartialState } from '@safe-global/store/safenet/safenetCheckSlice'
import { POLL_INTERVAL_FAST_MS } from '../constants'
import { CheckStatus, toPublicStatus, type PublicCheckStatus } from '../types/status'
import type { SafenetCheckSnapshot } from '../types/snapshot'
import { computePollingInterval } from '../utils/computePollingInterval'
import { mergeMonotonic } from '../utils/mergeMonotonic'

export type SafenetCheckView = {
  /** The last good snapshot; retained across a failed refetch (see `isStale`). */
  snapshot: SafenetCheckSnapshot | undefined
  /** Internal merged status — may be `AWAITING_VERIFICATION` / `VERIFICATION_FAILED`. */
  status: CheckStatus
  /** Public projection of {@link status} for display. */
  publicStatus: PublicCheckStatus
  /** First load with nothing to show yet. */
  isLoading: boolean
  /** A fetch (initial or poll) is in flight. */
  isFetching: boolean
  /** Showing a retained snapshot because the latest fetch failed. */
  isStale: boolean
  /** One-tap re-check. */
  refetch: () => void
}

/**
 * Subscribe to a check's chain-read lifecycle for a `safeTxHash`.
 *
 * Wraps the store's `getSafenetCheck` query and layers on:
 *  - a dynamic poll interval (fast pre-deadline, slow in the late window, stopped
 *    on a settled verdict) driven by {@link computePollingInterval};
 *  - a read-path merge against the session-pinned verdict so a transient failure
 *    or a chain reorg can never visibly walk the status backwards;
 *  - an error mapping — a failed fetch that still has a retained snapshot shows
 *    that snapshot as `isStale`, while a failure with nothing to fall back on
 *    reads as `UNAVAILABLE`.
 *
 * Platform-neutral: no DOM access, safe for both web and mobile.
 *
 * @param safeTxHash - the Safe transaction hash to watch, or `undefined` to skip.
 * @param timestampMs - when the Safe transaction happened, if known. Lets the
 *   reader target the matching block window rather than scanning back from the
 *   head, so an old check stays readable at the same cost as a fresh one.
 */
export const useSafenetCheck = (safeTxHash: string | undefined, timestampMs?: number | null): SafenetCheckView => {
  const skip = !safeTxHash

  // pollingInterval feeds back into the query below, so the (status → interval →
  // next poll) loop is reconfigured from the query's own output via an effect
  // rather than derivable in a single render pass.
  const [pollingInterval, setPollingInterval] = useState(POLL_INTERVAL_FAST_MS)

  const query = useGetSafenetCheckQuery(
    { safeTxHash: safeTxHash ?? '', timestampMs: timestampMs ?? null },
    {
      skip,
      pollingInterval,
      refetchOnFocus: true,
      skipPollingIfUnfocused: true,
    },
  )

  const pinned = useSelector((state: SafenetCheckPartialState) =>
    safeTxHash ? selectPinnedVerdict(state, safeTxHash) : undefined,
  )

  const snapshot = query.data
  const hasData = snapshot !== undefined
  const isStale = query.isError && hasData

  // With no snapshot to show (the first fetch failed) the base is UNAVAILABLE;
  // the monotonic merge still keeps any pinned floor from an earlier success.
  const base = snapshot?.status ?? CheckStatus.UNAVAILABLE
  const status = mergeMonotonic(pinned?.status, base)
  const publicStatus = toPublicStatus(status)

  useEffect(() => {
    const decision = computePollingInterval({
      status,
      headBlock: snapshot?.headBlock ?? null,
      deadlineBlock: snapshot?.deadlineBlock ?? null,
    })
    setPollingInterval(decision.shouldPoll ? decision.intervalMs : 0)
  }, [status, snapshot?.headBlock, snapshot?.deadlineBlock])

  const { refetch: queryRefetch } = query
  const refetch = useCallback(() => {
    if (!skip) queryRefetch()
  }, [skip, queryRefetch])

  return {
    snapshot,
    status,
    publicStatus,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isStale,
    refetch,
  }
}
