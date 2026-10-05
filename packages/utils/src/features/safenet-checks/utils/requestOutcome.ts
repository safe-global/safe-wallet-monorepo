import type { CheckEventBase, OracleRequestState, RequestOutcome, RequestRead, WindowCoverage } from '../types'

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

/**
 * Whether the lifecycle evidence of a read is complete: every request's own
 * flag, or — with no request — whether discovery proved the absence of one.
 */
export const isEvidenceComplete = (
  requests: ReadonlyArray<Pick<RequestRead, 'evidenceComplete'>>,
  windowCoverage: WindowCoverage,
): boolean =>
  requests.length === 0 ? windowCoverage === 'proven' : requests.every((request) => request.evidenceComplete)

type Position = Pick<CheckEventBase, 'blockNumber' | 'logIndex'> | null

export const lexical = (a: string, b: string): number => Number(a > b) - Number(a < b)

/** Known positions sort before unknown ones; `direction` 1 is ascending, -1 descending. */
export const comparePositions = (a: Position, b: Position, direction: 1 | -1): number => {
  if (a === null || b === null) return Number(a === null) - Number(b === null)
  return direction * (a.blockNumber - b.blockNumber || a.logIndex - b.logIndex)
}
