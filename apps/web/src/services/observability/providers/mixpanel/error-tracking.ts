import { matchUserOutcome, normalizeError } from '@safe-global/utils/services/exceptions/normalizeError'
import type { ErrorContext, SurfacedError } from '../../types'
import { MixpanelEvent, MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { mixpanelTrack } from '@/services/analytics/mixpanel'

/**
 * How long an identical `Error Surfaced` event is suppressed after being sent.
 *
 * Sized to swallow repeat-firing loops (the 15s CGW poll, concurrent mounts of
 * the same hook) while staying short enough that a genuinely recurring failure
 * is still visible as recurring. Chain ID and Safe address ride along as
 * Mixpanel super-properties and so cannot enter the key; the window is kept
 * short partly to bound how long a cross-Safe collapse could last.
 */
const DEDUPE_WINDOW_MS = 60_000

/** Ceiling on tracked keys, so a long-lived session cannot grow the map without bound. */
const MAX_TRACKED_ERRORS = 500

interface DedupeState {
  lastSentAt: number
  /** Occurrences collapsed since `lastSentAt`, reported on the next send. */
  suppressed: number
}

const sentErrors = new Map<string, DedupeState>()

/**
 * Maps the analytics-agnostic `ErrorContext` to Mixpanel event properties.
 * Only present keys are emitted, so events stay compact and free of `undefined`.
 */
const mapContext = (context?: ErrorContext): Record<string, string | number | boolean> => {
  if (!context) return {}
  return {
    ...(context.txHash && { [MixpanelEventParams.TX_HASH]: context.txHash }),
    ...(context.targetContractLabel && { [MixpanelEventParams.TARGET_CONTRACT_LABEL]: context.targetContractLabel }),
    ...(context.transactionType && { [MixpanelEventParams.TRANSACTION_TYPE]: context.transactionType }),
    ...(context.rpcEndpointKind && { [MixpanelEventParams.RPC_ENDPOINT_KIND]: context.rpcEndpointKind }),
    ...(context.rpcHost && { [MixpanelEventParams.RPC_HOST]: context.rpcHost }),
    ...(context.httpStatus && { [MixpanelEventParams.HTTP_STATUS]: context.httpStatus }),
    // Presence, not truthiness: distinguishing "attempt 1" from "untagged" is
    // the whole point of the facet, and `isRetry` must not read as false when
    // no attempt was reported at all.
    ...(context.attempt !== undefined && {
      [MixpanelEventParams.ERROR_ATTEMPT]: context.attempt,
      [MixpanelEventParams.IS_RETRY]: context.attempt > 1,
    }),
  }
}

/**
 * Evicts entries past their window first, then the least recently sent, until
 * the map is back within its ceiling.
 */
const pruneSentErrors = (now: number): void => {
  for (const [key, state] of sentErrors) {
    if (now - state.lastSentAt >= DEDUPE_WINDOW_MS) {
      sentErrors.delete(key)
    }
  }

  for (const key of sentErrors.keys()) {
    if (sentErrors.size <= MAX_TRACKED_ERRORS) break
    sentErrors.delete(key)
  }
}

/**
 * Claims the right to emit `key`, returning how many occurrences the event
 * stands for, or `undefined` while an identical event is still in its cooldown.
 */
const claimOccurrences = (key: string, now: number): number | undefined => {
  const state = sentErrors.get(key)

  if (state && now - state.lastSentAt < DEDUPE_WINDOW_MS) {
    state.suppressed += 1
    return undefined
  }

  const occurrences = (state?.suppressed ?? 0) + 1

  // Re-inserted rather than mutated so Map insertion order stays send-recency
  // order, which is what `pruneSentErrors` evicts by.
  sentErrors.delete(key)
  sentErrors.set(key, { lastSentAt: now, suppressed: 0 })

  if (sentErrors.size > MAX_TRACKED_ERRORS) {
    pruneSentErrors(now)
  }

  return occurrences
}

/**
 * Emits the single `Error Surfaced` analytics event (WA-2775).
 *
 * Sends enums (+ whitelisted context like txHash) only — the raw/sanitized
 * message stays out of Mixpanel so no wallet, address or calldata can leak into
 * analytics (AC7). Reused properties (Blockchain Network, Safe Address, EOA
 * Wallet Label) are attached automatically as Mixpanel super-properties.
 *
 * Identical events inside `DEDUPE_WINDOW_MS` are collapsed into one, which then
 * reports the collapsed count as `Error Occurrences`, so repeat-firing sources
 * (polling loaders, a hook mounted several times over one failure) stop
 * inflating the event volume without losing the fact that they recurred. Totals
 * are therefore `sum(Error Occurrences)`, not an event count. Deduplication is
 * deliberately Mixpanel-only — Datadog RUM keeps full per-occurrence fidelity.
 */
export const trackErrorSurfaced = ({ code, message, isUserFacing, context }: SurfacedError): void => {
  // User-driven outcomes (rejection, approval-prompt expiry) are not errors —
  // they never surface as an Error Surfaced event (WA-2950). Checked before any
  // dedupe bookkeeping so they leave no trace in the map.
  if (matchUserOutcome(message)) {
    return
  }

  const normalized = normalizeError({ code, message, isUserFacing })

  const properties = {
    [MixpanelEventParams.ERROR_DOMAIN]: normalized.domain,
    [MixpanelEventParams.ERROR_TYPE]: normalized.type,
    [MixpanelEventParams.ERROR_LAYER]: normalized.layer,
    [MixpanelEventParams.ERROR_CODE]: normalized.code,
    [MixpanelEventParams.IS_USER_FACING]: normalized.isUserFacing,
    ...mapContext(context),
  }

  // Keyed off the emitted properties themselves, so every facet that makes two
  // events genuinely different — `attempt` above all — separates them here for
  // free, and a facet added later cannot be forgotten.
  const occurrences = claimOccurrences(JSON.stringify(properties), Date.now())
  if (occurrences === undefined) {
    return
  }

  mixpanelTrack(MixpanelEvent.ERROR_SURFACED, {
    ...properties,
    [MixpanelEventParams.ERROR_OCCURRENCES]: occurrences,
  })
}

/** Test-only: clears the dedupe map between unit tests. */
export const __resetErrorSurfacedDedupeForTests = (): void => {
  sentErrors.clear()
}
