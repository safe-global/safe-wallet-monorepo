import { matchUserOutcome, normalizeError } from '@safe-global/utils/services/exceptions/normalizeError'
import { ERROR_CODE_MAP, ErrorType } from '@safe-global/utils/services/exceptions/errorTaxonomy'
import { isRevertError } from '@safe-global/utils/services/exceptions/contractErrors'
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
  /** Occurrences collapsed since `lastSentAt`, reported on the next send or on flush. */
  suppressed: number
  /** The event this key stands for, so a flush can emit it without a fresh occurrence. */
  properties: EventProperties
  /** Fires one window after `lastSentAt` to emit whatever was collapsed since. */
  flushTimer?: ReturnType<typeof setTimeout>
}

type EventProperties = Record<string, string | number | boolean>

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
 * Ignore gas estimation reverts (prediction), only track real failures.
 */
const isPredictedRevert = (code: number, message: string): boolean =>
  ERROR_CODE_MAP[code]?.type === ErrorType.GAS_ESTIMATION_FAILED && isRevertError({ message })

/**
 * Evicts entries past their window first, then the least recently sent, until
 * the map is back within its ceiling.
 */
const forget = (key: string): void => {
  const state = sentErrors.get(key)
  state?.flushTimer && clearTimeout(state.flushTimer)
  sentErrors.delete(key)
}

const pruneSentErrors = (now: number): void => {
  for (const [key, state] of sentErrors) {
    if (now - state.lastSentAt >= DEDUPE_WINDOW_MS) {
      forget(key)
    }
  }

  for (const key of sentErrors.keys()) {
    if (sentErrors.size <= MAX_TRACKED_ERRORS) break
    forget(key)
  }
}

/**
 * Emits whatever was collapsed during the window that just ended.
 *
 * Without this the count is only carried out by the *next* occurrence, so a
 * failure a user retried three times and then gave up on reported as one — the
 * trailing two were dropped when the entry expired. Reschedules while
 * occurrences keep arriving, and lets the entry go once a window passes quietly.
 */
const scheduleFlush = (key: string): ReturnType<typeof setTimeout> =>
  setTimeout(() => {
    const state = sentErrors.get(key)
    if (!state) return

    if (state.suppressed === 0) {
      sentErrors.delete(key)
      return
    }

    const occurrences = state.suppressed
    state.lastSentAt = Date.now()
    state.suppressed = 0
    state.flushTimer = scheduleFlush(key)

    mixpanelTrack(MixpanelEvent.ERROR_SURFACED, {
      ...state.properties,
      [MixpanelEventParams.ERROR_OCCURRENCES]: occurrences,
    })
  }, DEDUPE_WINDOW_MS)

/**
 * Claims the right to emit `key`, returning how many occurrences the event
 * stands for, or `undefined` while an identical event is still in its cooldown.
 */
const claimOccurrences = (key: string, properties: EventProperties, now: number): number | undefined => {
  const state = sentErrors.get(key)

  if (state && now - state.lastSentAt < DEDUPE_WINDOW_MS) {
    state.suppressed += 1
    return undefined
  }

  const occurrences = (state?.suppressed ?? 0) + 1

  // Re-inserted rather than mutated so Map insertion order stays send-recency
  // order, which is what `pruneSentErrors` evicts by.
  state?.flushTimer && clearTimeout(state.flushTimer)
  sentErrors.delete(key)
  sentErrors.set(key, { lastSentAt: now, suppressed: 0, properties, flushTimer: scheduleFlush(key) })

  if (sentErrors.size > MAX_TRACKED_ERRORS) {
    pruneSentErrors(now)
  }

  return occurrences
}

/**
 * Tracks a deduped `Error Surfaced` event, enums only, sum occurrences.
 */
export const trackErrorSurfaced = ({ code, message, isUserFacing, context }: SurfacedError): void => {
  // User-driven outcomes (rejection, approval-prompt expiry) are not errors —
  // they never surface as an Error Surfaced event (WA-2950). Checked before any
  // dedupe bookkeeping so they leave no trace in the map.
  if (matchUserOutcome(message)) {
    return
  }

  if (isPredictedRevert(code, message)) {
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
  const occurrences = claimOccurrences(JSON.stringify(properties), properties, Date.now())
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
  for (const state of sentErrors.values()) {
    state.flushTimer && clearTimeout(state.flushTimer)
  }
  sentErrors.clear()
}
