import { CheckEventType, OracleRequestState, type Hex, type NormalizedCheckEvent } from '../types'

const RESOLVING_EVENTS: Partial<Record<CheckEventType, true>> = {
  [CheckEventType.DISPUTE_RESOLVED]: true,
  [CheckEventType.ARBITRATION_TIMED_OUT]: true,
  [CheckEventType.DISPUTE_OUT_OF_SCOPE]: true,
}

/**
 * The requests whose dispute the events leave open: a dispute was triggered and
 * no ruling, arbitration timeout or out-of-scope event follows. Like every other
 * predicate over a check's events, it ignores which request an event belongs to.
 */
export const openDisputeRequestIds = (events: ReadonlyArray<NormalizedCheckEvent>): Hex[] => {
  if (events.some((event) => RESOLVING_EVENTS[event.type])) return []

  const triggered = events.flatMap((event) =>
    event.type === CheckEventType.DISPUTE_TRIGGERED ? [event.requestId] : [],
  )
  return [...new Set(triggered)]
}

/**
 * The event a request's current oracle state stands in for once its ruling sits
 * outside the block window the logs were read from, or `null` while the dispute
 * is still open. No log backs it, so it carries the head block and no transaction.
 */
export const rulingEventFor = (
  requestId: Hex,
  state: OracleRequestState,
  headBlock: number,
): NormalizedCheckEvent | null => {
  const base = { requestId, blockNumber: headBlock, logIndex: 0, transactionHash: '' }

  switch (state) {
    case OracleRequestState.RESOLVED_APPROVED:
    case OracleRequestState.RESOLVED_DENIED:
      return { ...base, type: CheckEventType.DISPUTE_RESOLVED, outcome: state, slashed: '0' }
    case OracleRequestState.TIMED_OUT:
      return { ...base, type: CheckEventType.ARBITRATION_TIMED_OUT }
    default:
      return null
  }
}
