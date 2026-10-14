import {
  AttestationVerificationStatus,
  CheckEventType,
  UNVERIFIED_ATTESTATION,
  type NormalizedCheckEvent,
} from '@safe-global/utils/features/safenet-checks'
import {
  attestedEvent,
  oracleResultEvent,
  requestCreatedEvent,
  sentinelCommittedEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { explainFailure, formatFlaggedCount, summariseRejection } from '../summariseRejection'

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
