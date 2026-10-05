import {
  CheckEventType,
  type NormalizedCheckEvent,
  type OracleRequestState,
  type RequestOutcome,
  type RequestRead,
  type RequestRef,
  type SentinelVote,
} from '../types'
import { requestOutcome } from './requestOutcome'

/** The authoritative facts `getRequest` returns for one request. */
export type RequestFacts = {
  state: OracleRequestState
  commitDeadlineBlock: string
  revealDeadlineBlock: string
  arbitrationDeadlineBlock: string | null
  committedCount: number
  revealedCount: number
  approveCount: number
  denyCount: number
}

const emptyVote = (sentinel: string, bondAmount: string): SentinelVote => ({
  sentinel,
  approved: null,
  reason: null,
  bondAmount,
  commitTxHash: null,
  revealTxHash: null,
})

/**
 * One row per sentinel seen committing or revealing, sorted by lowercase address.
 * A reveal's bond amount wins over the commit's. Sentinels that never committed
 * get no row: the reader claims no expected total.
 */
const buildVotes = (events: ReadonlyArray<NormalizedCheckEvent>): SentinelVote[] => {
  const votes = new Map<string, SentinelVote>()
  for (const event of events) {
    if (event.type === CheckEventType.SENTINEL_COMMITTED) {
      const key = event.sentinel.toLowerCase()
      const vote = votes.get(key) ?? emptyVote(event.sentinel, event.bondAmount)
      votes.set(key, { ...vote, commitTxHash: event.transactionHash })
    } else if (event.type === CheckEventType.SENTINEL_REVEALED) {
      const key = event.sentinel.toLowerCase()
      const vote = votes.get(key) ?? emptyVote(event.sentinel, event.bondAmount)
      votes.set(key, {
        ...vote,
        approved: event.approved,
        reason: event.reason,
        bondAmount: event.bondAmount,
        revealTxHash: event.transactionHash,
      })
    }
  }
  return [...votes.entries()].sort(([a], [b]) => Number(a > b) - Number(a < b)).map(([, vote]) => vote)
}

type Resolution = Pick<RequestRead, 'resolution' | 'resolutionContext' | 'resolutionTxHash'>

const NO_RESOLUTION: Resolution = { resolution: null, resolutionContext: null, resolutionTxHash: null }

/** The latest event of a type (the input is in ascending log order). */
const lastEvent = <T extends NormalizedCheckEvent['type']>(
  events: ReadonlyArray<NormalizedCheckEvent>,
  type: T,
): Extract<NormalizedCheckEvent, { type: T }> | undefined =>
  events.filter((event): event is Extract<NormalizedCheckEvent, { type: T }> => event.type === type).slice(-1)[0]

const councilResolution = (events: ReadonlyArray<NormalizedCheckEvent>): Resolution => {
  const ruling = lastEvent(events, CheckEventType.DISPUTE_RESOLVED)
  return {
    resolution: 'COUNCIL',
    resolutionContext: ruling?.context ?? null,
    resolutionTxHash: ruling?.transactionHash ?? null,
  }
}

/** Out of scope and arbitration timeout both end as `NO_RULING`; only their logs tell them apart. */
const noRulingResolution = (events: ReadonlyArray<NormalizedCheckEvent>): Resolution => {
  const outOfScope = lastEvent(events, CheckEventType.DISPUTE_OUT_OF_SCOPE)
  if (outOfScope) {
    return {
      resolution: 'OUT_OF_SCOPE',
      resolutionContext: outOfScope.context,
      resolutionTxHash: outOfScope.transactionHash,
    }
  }
  const timedOut = lastEvent(events, CheckEventType.ARBITRATION_TIMED_OUT)
  if (!timedOut) return NO_RESOLUTION
  return { resolution: 'ARBITRATION_TIMEOUT', resolutionContext: null, resolutionTxHash: timedOut.transactionHash }
}

const requestTimeoutResolution = (events: ReadonlyArray<NormalizedCheckEvent>): Resolution => ({
  resolution: 'REQUEST_TIMEOUT',
  resolutionContext: null,
  resolutionTxHash: lastEvent(events, CheckEventType.REQUEST_TIMED_OUT)?.transactionHash ?? null,
})

const RESOLUTIONS: Partial<Record<RequestOutcome, (events: ReadonlyArray<NormalizedCheckEvent>) => Resolution>> = {
  RULED_SECURE: councilResolution,
  RULED_INSECURE: councilResolution,
  NO_RULING: noRulingResolution,
  TIMED_OUT: requestTimeoutResolution,
}

/**
 * Assemble one request's read from its getter facts and the Oracle logs seen for
 * it. The state and counts are authoritative; the logs only add votes, reasons,
 * context and transaction hashes, and may be incomplete. `evidence` may hold
 * other requests' logs; only this request's are used.
 */
export const buildRequestRead = ({
  ref,
  facts,
  evidence,
}: {
  ref: RequestRef
  facts: RequestFacts
  evidence: ReadonlyArray<NormalizedCheckEvent>
}): RequestRead => {
  const events = evidence.filter((event) => 'requestId' in event && event.requestId === ref.requestId)
  const outcome = requestOutcome(facts)
  return {
    ...ref,
    ...facts,
    outcome,
    votes: buildVotes(events),
    ...(RESOLUTIONS[outcome]?.(events) ?? NO_RESOLUTION),
  }
}
