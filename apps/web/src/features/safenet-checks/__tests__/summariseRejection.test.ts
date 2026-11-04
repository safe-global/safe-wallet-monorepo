import { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  AttestationVerificationStatus,
  CheckEventType,
  UNVERIFIED_ATTESTATION,
  type NormalizedCheckEvent,
} from '@safe-global/utils/features/safenet-checks'
import {
  arbitrationTimedOutEvent,
  attestedEvent,
  disputeResolvedEvent,
  disputeTriggeredEvent,
  oracleResultEvent,
  requestCreatedEvent,
  sentinelCommittedEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { explainFailure, formatFlaggedCount, rejectionSeverity, summariseRejection } from '../summariseRejection'

const SENTINELS = ['0x01', '0x02', '0x03', '0x04'].map((s) => s.padEnd(42, '0'))

const vote = (index: number, reason: string | null, blockNumber = 100 + index) =>
  sentinelRevealedEvent({
    sentinel: SENTINELS[index],
    approved: reason === null,
    reason: reason ?? '',
    blockNumber,
    logIndex: 0,
  })

describe('summariseRejection', () => {
  it('counts each cited rule once, most-cited first', () => {
    const summary = summariseRejection([vote(0, 'R-4.4'), vote(1, 'R-4.5'), vote(2, 'R-4.5'), vote(3, 'R-4.5')])

    expect(summary.rules.map(({ id, citedBy }) => [id, citedBy])).toEqual([
      ['R-4.5', 3],
      ['R-4.4', 1],
    ])
  })

  it('flags an unrecognised reason', () => {
    const summary = summariseRejection([vote(0, 'R-4.2'), vote(1, 'R-9.9')])

    expect(summary.rules.map(({ id }) => id)).toEqual(['R-4.2'])
    expect(summary).toMatchObject({ flagged: 2, revealed: 2, unrecognised: true })
  })

  it('keeps the latest reveal of a sentinel', () => {
    const summary = summariseRejection([vote(0, 'R-4.1', 100), vote(0, 'R-4.2', 200)])

    expect(summary.rules.map(({ id }) => id)).toEqual(['R-4.2'])
    expect(summary).toMatchObject({ flagged: 1, revealed: 1 })
  })
})

describe('formatFlaggedCount', () => {
  it('reads N of M across a split vote', () => {
    const summary = summariseRejection([vote(0, null), vote(1, 'R-4.1')])

    expect(formatFlaggedCount(summary)).toBe('1 of 2 sentinels flagged this.')
  })
})

describe('explainFailure', () => {
  const outOfScope: NormalizedCheckEvent = {
    ...requestCreatedEvent(),
    type: CheckEventType.DISPUTE_OUT_OF_SCOPE,
  }

  it.each<[string, NormalizedCheckEvent[], string]>([
    ['no vote', [requestCreatedEvent(), sentinelCommittedEvent()], 'No sentinel voted before the deadline.'],
    ['votes without a result', [sentinelRevealedEvent()], 'Not enough sentinels voted before the deadline.'],
    [
      'a result without a verified signature',
      [sentinelRevealedEvent(), oracleResultEvent(), attestedEvent()],
      'Sentinels voted, but the validators did not sign the result in time.',
    ],
    [
      'an out-of-scope ruling',
      [sentinelRevealedEvent(), outOfScope],
      'Safenet gave no ruling because this transaction is out of scope.',
    ],
    [
      'an open dispute',
      [sentinelRevealedEvent(), disputeTriggeredEvent()],
      'Sentinels disagreed. The dispute is open.',
    ],
    [
      'a dispute whose arbitration got no ruling',
      [sentinelRevealedEvent(), disputeTriggeredEvent(), arbitrationTimedOutEvent()],
      'Sentinels disagreed, and the dispute got no final ruling.',
    ],
    [
      'a dispute approved but not yet signed',
      [sentinelRevealedEvent(), disputeTriggeredEvent(), disputeResolvedEvent()],
      'Sentinels voted, but the validators did not sign the result in time.',
    ],
  ])('explains %s', (_, events, reason) => {
    expect(explainFailure({ events, attestation: UNVERIFIED_ATTESTATION })).toBe(reason)
  })

  it('names a signature that did not verify', () => {
    const attestation = { status: AttestationVerificationStatus.INVALID, signatureId: null, message: null }

    expect(explainFailure({ events: [oracleResultEvent(), attestedEvent()], attestation })).toBe(
      "The validators' signature could not be verified.",
    )
  })
})

describe('rejectionSeverity', () => {
  it.each<[string, NormalizedCheckEvent[], Severity]>([
    ['warns when every cited rule is a warning rule', [vote(0, 'R-4.1'), vote(1, 'R-4.5')], Severity.WARN],
    ['stays a threat when a known-malicious address is cited', [vote(0, 'R-4.1'), vote(1, 'R-4.6')], Severity.CRITICAL],
    ['stays a threat when a sentinel gives an unknown reason', [vote(0, 'R-4.3'), vote(1, 'R-9.9')], Severity.CRITICAL],
    ['stays a threat when no sentinel revealed a reason', [], Severity.CRITICAL],
  ])('%s', (_, events, severity) => {
    expect(rejectionSeverity(summariseRejection(events))).toBe(severity)
  })
})
