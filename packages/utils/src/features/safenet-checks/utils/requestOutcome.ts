import type { OracleRequestState, RequestOutcome, RequestRead } from '../types'

/**
 * Outcome per state: `[unanimous or open, contested]`. Contested means both vote
 * counts are positive, so a resolved or timed-out request went through
 * arbitration instead of settling by unanimity.
 */
const OUTCOMES: Record<OracleRequestState, readonly [RequestOutcome, RequestOutcome]> = {
  PENDING: ['PENDING', 'PENDING'],
  FROZEN: ['DISPUTED', 'DISPUTED'],
  RESOLVED_APPROVED: ['APPROVED', 'RULED_SECURE'],
  RESOLVED_DENIED: ['DENIED', 'RULED_INSECURE'],
  TIMED_OUT: ['TIMED_OUT', 'NO_RULING'],
}

/**
 * A request's outcome from its state and vote counts alone. Elapsed deadlines
 * never change it: a frozen dispute stays `DISPUTED` past its arbitration deadline.
 */
export const requestOutcome = (request: Pick<RequestRead, 'state' | 'approveCount' | 'denyCount'>): RequestOutcome => {
  const contested = request.approveCount > 0 && request.denyCount > 0
  return OUTCOMES[request.state][contested ? 1 : 0]
}
