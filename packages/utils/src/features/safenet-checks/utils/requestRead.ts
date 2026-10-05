import type { OracleRequestState, RequestRead, RequestRef } from '../types'
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

export const buildRequestRead = ({ ref, facts }: { ref: RequestRef; facts: RequestFacts }): RequestRead => ({
  ...ref,
  ...facts,
  outcome: requestOutcome(facts),
})
