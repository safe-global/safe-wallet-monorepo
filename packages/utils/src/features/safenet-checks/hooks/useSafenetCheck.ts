import { useCallback, useEffect, useState } from 'react'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { recordAim } from '@safe-global/store/safenet/safenetAimRegistry'
import { POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../constants'
import { CheckStatus, toPublicStatus, type PublicCheckStatus, type UnavailableReason } from '../types/status'
import type { SafenetCheckSnapshot } from '../types/snapshot'
import { computePollingInterval } from '../utils/computePollingInterval'
import type { CheckTarget } from '../utils/attestations'

export type SafenetCheckView = {
  /** The last complete snapshot; retained across a failed refetch (see `isStale`). */
  snapshot: SafenetCheckSnapshot | undefined
  /** Internal status. Can be `AWAITING_VERIFICATION` or `VERIFICATION_FAILED`. */
  status: CheckStatus
  publicStatus: PublicCheckStatus
  /**
   * Set only while the status is `UNAVAILABLE` and no request outcome explains
   * it — see {@link UnavailableReason}. `undefined` before the first read resolves.
   */
  unavailableReason: UnavailableReason | undefined
  isLoading: boolean
  isFetching: boolean
  /** Showing a retained snapshot because the latest fetch failed. */
  isStale: boolean
  refetch: () => void
}

/**
 * Which `UNAVAILABLE` a resolved read means, or `undefined` while the status is a
 * real one. A retained snapshot with an outcome (a Council secure ruling, no
 * ruling) is UNAVAILABLE for a known reason, so it claims none. `NO_CHECK` is a
 * factual claim about the chain, so only discovery that proved the absence of any
 * request licenses it; over any other window the read found nothing where it
 * looked, which is a weaker statement. A snapshot outranks the error: an error
 * over retained data is a failed refetch, and the snapshot is still what we know.
 */
const resolveUnavailableReason = (
  status: CheckStatus,
  snapshot: SafenetCheckSnapshot | undefined,
  hasError: boolean,
): UnavailableReason | undefined => {
  if (status !== CheckStatus.UNAVAILABLE) return undefined
  if (snapshot !== undefined) {
    if (snapshot.outcome !== null) return undefined
    return snapshot.windowCoverage === 'proven' ? 'NO_CHECK' : 'WINDOW_UNCERTAIN'
  }
  return hasError ? 'READ_FAILED' : undefined
}

/**
 * Re-derive the poll interval from the latest result. The interval feeds back
 * into the query, so the (state → interval → next poll) loop is reconfigured from
 * the query's own output via an effect. A landed poll (`fulfilledAt`) re-runs it,
 * so the grace window is re-evaluated against a fresh clock.
 */
const usePollingSchedule = (input: {
  snapshot: SafenetCheckSnapshot | undefined
  hasError: boolean
  aim: number | null
  fulfilledAt: number | undefined
  setPollingInterval: (interval: number) => void
}): void => {
  const { snapshot, hasError, aim, fulfilledAt, setPollingInterval } = input
  useEffect(() => {
    // A failed poll — with or without retained data — is a transient endpoint
    // problem, not a settled check: retry at the slow cadence. This is the only
    // recovery path on mobile, which has no focus-refetch listeners.
    if (hasError) {
      setPollingInterval(POLL_INTERVAL_LATE_MS)
      return
    }
    setPollingInterval(
      computePollingInterval({
        requests: snapshot?.requests ?? [],
        headBlock: snapshot?.headBlock ?? null,
        submittedAtMs: aim,
        nowMs: Date.now(),
      }),
    )
  }, [hasError, snapshot?.requests, snapshot?.headBlock, aim, fulfilledAt, setPollingInterval])
}

/**
 * Subscribe to a check's chain-read lifecycle for a `safeTxHash`. Wraps the
 * store's `getSafenetCheck` query with the dynamic poll interval and the
 * stale/UNAVAILABLE error mapping. Every poll replaces the snapshot as a unit,
 * so the status always belongs to the request the snapshot names.
 * Platform-neutral (no DOM access). `target` is the Safe being viewed, which
 * every request and attestation must name. `timestampMs` is this surface's idea
 * of the submission time: it is offered to the aim registry, which keeps the
 * earliest offer and aims every read of this check with it. Surfaces therefore
 * need not agree — a surface offering an earlier time re-aims the shared read
 * once, and a later one changes nothing.
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

  const [pollingInterval, setPollingInterval] = useState(POLL_INTERVAL_FAST_MS)

  const query = useGetSafenetCheckQuery(identity, {
    skip,
    pollingInterval,
    skipPollingIfUnfocused: true,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })

  const snapshot = query.data
  const hasData = snapshot !== undefined
  // Keyed on the retained error, not `isError`: RTK Query flips `isError` off
  // during each retry's pending phase while `error` and `data` persist.
  const hasError = query.error !== undefined
  const isStale = hasError && hasData

  const status = snapshot?.status ?? CheckStatus.UNAVAILABLE
  const publicStatus = toPublicStatus(status)

  const unavailableReason = resolveUnavailableReason(status, snapshot, hasError)

  usePollingSchedule({ snapshot, hasError, aim, fulfilledAt: query.fulfilledTimeStamp, setPollingInterval })

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
