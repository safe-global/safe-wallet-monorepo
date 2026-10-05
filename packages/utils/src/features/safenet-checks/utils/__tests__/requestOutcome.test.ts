import type { OracleRequestState, RequestOutcome, WindowCoverage } from '../../types'
import { isEvidenceComplete, requestOutcome } from '../requestOutcome'

type OutcomeCase = [state: OracleRequestState, approveCount: number, denyCount: number, outcome: RequestOutcome]

const OUTCOME_CASES: OutcomeCase[] = [
  ['PENDING', 0, 0, 'PENDING'],
  ['PENDING', 2, 0, 'PENDING'],
  ['PENDING', 0, 2, 'PENDING'],
  ['PENDING', 2, 1, 'PENDING'],

  ['FROZEN', 0, 0, 'DISPUTED'],
  ['FROZEN', 2, 0, 'DISPUTED'],
  ['FROZEN', 0, 2, 'DISPUTED'],
  ['FROZEN', 2, 1, 'DISPUTED'],

  ['RESOLVED_APPROVED', 0, 0, 'APPROVED'],
  ['RESOLVED_APPROVED', 2, 0, 'APPROVED'],
  ['RESOLVED_APPROVED', 0, 2, 'APPROVED'],
  ['RESOLVED_APPROVED', 2, 1, 'RULED_SECURE'],
  ['RESOLVED_APPROVED', 1, 2, 'RULED_SECURE'],

  ['RESOLVED_DENIED', 0, 0, 'DENIED'],
  ['RESOLVED_DENIED', 2, 0, 'DENIED'],
  ['RESOLVED_DENIED', 0, 2, 'DENIED'],
  ['RESOLVED_DENIED', 2, 1, 'RULED_INSECURE'],
  ['RESOLVED_DENIED', 1, 2, 'RULED_INSECURE'],

  ['TIMED_OUT', 0, 0, 'TIMED_OUT'],
  ['TIMED_OUT', 2, 0, 'TIMED_OUT'],
  ['TIMED_OUT', 0, 2, 'TIMED_OUT'],
  ['TIMED_OUT', 2, 1, 'NO_RULING'],
  ['TIMED_OUT', 1, 2, 'NO_RULING'],
]

describe('requestOutcome', () => {
  it.each(OUTCOME_CASES)('%s with %i approve and %i deny votes is %s', (state, approveCount, denyCount, outcome) => {
    expect(requestOutcome({ state, approveCount, denyCount })).toBe(outcome)
  })
})

describe('isEvidenceComplete', () => {
  type CompleteCase = [flags: boolean[], coverage: WindowCoverage, complete: boolean]

  const COMPLETE_CASES: CompleteCase[] = [
    [[], 'proven', true],
    [[], 'heuristic', false],
    [[true], 'proven', true],
    [[true], 'heuristic', true],
    [[false], 'proven', false],
    [[false], 'heuristic', false],
    [[true, true, true], 'heuristic', true],
    [[false, true, true], 'proven', false],
    [[true, false, true], 'proven', false],
    [[true, true, false], 'proven', false],
  ]

  it.each(COMPLETE_CASES)('requests %j with %s coverage is complete: %s', (flags, coverage, complete) => {
    const requests = flags.map((evidenceComplete) => ({ evidenceComplete }))

    expect(isEvidenceComplete(requests, coverage)).toBe(complete)
  })
})
