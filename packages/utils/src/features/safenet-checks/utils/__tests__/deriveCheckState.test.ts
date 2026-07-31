import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveCheckState } from '../deriveCheckState'
import {
  attestedEvent,
  disputeResolvedEvent,
  oracleResultEvent,
  plainAttestedEvent,
  plainProposedEvent,
  proposedEvent,
  requestCreatedEvent,
  sentinelCommittedEvent,
  sentinelRevealedEvent,
} from '../../builders/checkEvents'
import { decodeLogs } from '../decodeLogs'
import {
  AttestationVerificationStatus,
  CheckEventType,
  CheckStatus,
  OracleGeneration,
  UNVERIFIED_ATTESTATION,
  type AttestationVerification,
  type NormalizedCheckEvent,
} from '../../types'

const verification = (status: AttestationVerificationStatus): AttestationVerification => ({
  status,
  signatureId: '0xsig',
  message: '0xmsg',
})

const derive = (
  events: NormalizedCheckEvent[],
  headBlock: string | null = '140',
  attestation: AttestationVerification = UNVERIFIED_ATTESTATION,
) => deriveCheckState({ events, headBlock, attestation })

// A request that times out at block 150.
const request = () => requestCreatedEvent({ deadlineBlock: '150', commitDeadlineBlock: '150' })

describe('deriveCheckState — precedence table', () => {
  it('SUBMITTED when only proposed', () => {
    expect(derive([proposedEvent()])).toBe(CheckStatus.SUBMITTED)
  })

  it('UNAVAILABLE for an empty event set — nothing was ever proposed for this hash', () => {
    expect(derive([])).toBe(CheckStatus.UNAVAILABLE)
  })

  describe('non-oracle path (validator-run deterministic checks)', () => {
    const plain = () => [plainProposedEvent(), plainAttestedEvent()]

    it('BENIGN once the attestation verifies — the validators ran their checks', () => {
      expect(derive(plain(), '100', verification(AttestationVerificationStatus.VERIFIED))).toBe(CheckStatus.BENIGN)
    })

    it('never BENIGN on an unverified attestation', () => {
      expect(derive(plain(), '100', verification(AttestationVerificationStatus.PENDING))).toBe(
        CheckStatus.AWAITING_VERIFICATION,
      )
    })

    it('VERIFICATION_FAILED on a signature that does not verify', () => {
      expect(derive(plain(), '100', verification(AttestationVerificationStatus.INVALID))).toBe(
        CheckStatus.VERIFICATION_FAILED,
      )
    })

    it('SUBMITTED while only the proposal has landed', () => {
      expect(derive([plainProposedEvent()])).toBe(CheckStatus.SUBMITTED)
    })

    it('loses to a negative oracle verdict on the same hash', () => {
      expect(
        derive(
          [plainAttestedEvent(), oracleResultEvent({ approved: false })],
          '100',
          verification(AttestationVerificationStatus.VERIFIED),
        ),
      ).toBe(CheckStatus.MALICIOUS)
    })
  })

  it('IN_PROGRESS once a request is open, pre-deadline', () => {
    expect(derive([proposedEvent(), request()], '140')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('IN_PROGRESS on V2 commit activity (no verdict yet)', () => {
    const events = [proposedEvent(), request(), sentinelCommittedEvent({ generation: OracleGeneration.V2 })]
    expect(derive(events, '140')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('positive OracleResult alone is NOT BENIGN — it is IN_PROGRESS', () => {
    const events = [proposedEvent(), request(), oracleResultEvent({ approved: true })]
    expect(derive(events, '140')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('AWAITING_VERIFICATION when attested but not yet verified', () => {
    const events = [proposedEvent(), request(), attestedEvent()]
    expect(derive(events, '140', UNVERIFIED_ATTESTATION)).toBe(CheckStatus.AWAITING_VERIFICATION)
    expect(derive(events, '140', verification(AttestationVerificationStatus.PENDING))).toBe(
      CheckStatus.AWAITING_VERIFICATION,
    )
  })

  it('BENIGN only when attested AND verified', () => {
    const events = [proposedEvent(), request(), attestedEvent(), oracleResultEvent({ approved: true })]
    expect(derive(events, '140', verification(AttestationVerificationStatus.VERIFIED))).toBe(CheckStatus.BENIGN)
  })

  it('VERIFICATION_FAILED when attested but signature invalid — never BENIGN', () => {
    const events = [proposedEvent(), request(), attestedEvent()]
    const status = derive(events, '140', verification(AttestationVerificationStatus.INVALID))
    expect(status).toBe(CheckStatus.VERIFICATION_FAILED)
    expect(status).not.toBe(CheckStatus.BENIGN)
  })

  it('a lone V1 negative commit is NOT a verdict — one sentinel cannot red-flag a tx', () => {
    const events = [
      proposedEvent(),
      request(),
      sentinelCommittedEvent({ generation: OracleGeneration.V1, approved: false }),
    ]
    expect(derive(events, '140')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('a lone V2 negative reveal is NOT a verdict — the oracle resolves by unanimity', () => {
    const events = [proposedEvent(), request(), sentinelRevealedEvent({ approved: false })]
    expect(derive(events, '140')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('MALICIOUS on a negative OracleResult', () => {
    const events = [proposedEvent(), request(), oracleResultEvent({ approved: false })]
    expect(derive(events, '140')).toBe(CheckStatus.MALICIOUS)
  })

  it('TIMED_OUT past the deadline with no verdict', () => {
    expect(derive([proposedEvent(), request()], '151')).toBe(CheckStatus.TIMED_OUT)
  })

  it('TIMED_OUT for a frozen dispute past the deadline', () => {
    const events = [proposedEvent(), request(), disputeResolvedEvent()]
    expect(derive(events, '151')).toBe(CheckStatus.TIMED_OUT)
  })
})

describe('deriveCheckState — head == deadline boundary', () => {
  it('stays IN_PROGRESS at head == deadline (reveal window is inclusive)', () => {
    expect(derive([proposedEvent(), request()], '150')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('TIMED_OUT one block later', () => {
    expect(derive([proposedEvent(), request()], '151')).toBe(CheckStatus.TIMED_OUT)
  })
})

describe('deriveCheckState — late verdicts beat the deadline', () => {
  it('late BENIGN: attested+verified past deadline is BENIGN, not TIMED_OUT', () => {
    const events = [proposedEvent(), request(), attestedEvent()]
    expect(derive(events, '999', verification(AttestationVerificationStatus.VERIFIED))).toBe(CheckStatus.BENIGN)
  })

  it('late MALICIOUS: a negative verdict past deadline is MALICIOUS, not TIMED_OUT', () => {
    const events = [proposedEvent(), request(), oracleResultEvent({ approved: false })]
    expect(derive(events, '999')).toBe(CheckStatus.MALICIOUS)
  })

  it('VERIFICATION_FAILED past deadline stays VERIFICATION_FAILED, not TIMED_OUT', () => {
    const events = [proposedEvent(), request(), attestedEvent()]
    expect(derive(events, '999', verification(AttestationVerificationStatus.INVALID))).toBe(
      CheckStatus.VERIFICATION_FAILED,
    )
  })
})

describe('deriveCheckState — negative verdict outranks a verified attestation', () => {
  it('MALICIOUS wins over attested+verified when both are present', () => {
    const events = [proposedEvent(), request(), attestedEvent(), oracleResultEvent({ approved: false })]
    expect(derive(events, '140', verification(AttestationVerificationStatus.VERIFIED))).toBe(CheckStatus.MALICIOUS)
  })
})

describe('deriveCheckState — order independence', () => {
  it('a reversed event set derives the same status (derive is a fold, not a replay)', () => {
    const events = [proposedEvent(), request(), attestedEvent(), oracleResultEvent({ approved: false })]
    const verified = verification(AttestationVerificationStatus.VERIFIED)
    expect(derive([...events].reverse(), '140', verified)).toBe(derive(events, '140', verified))
    expect(derive([...events].reverse(), '140', verified)).toBe(CheckStatus.MALICIOUS)
  })
})

describe('deriveCheckState — live-captured beta logs through the real decoder', () => {
  // The checked-in live pair (an Arbitrum Safe checked on Gnosis beta): decode
  // the actual deployed bytes, then derive — the two slices composed on real data.
  const fixture = JSON.parse(
    readFileSync(join(__dirname, '../../__fixtures__/gnosis-plain-lifecycle.captured.json'), 'utf8'),
  )
  const events = decodeLogs(fixture.logs)

  it('verified live pair resolves BENIGN', () => {
    expect(
      deriveCheckState({
        events,
        attestation: verification(AttestationVerificationStatus.VERIFIED),
        headBlock: '47445100',
      }),
    ).toBe(CheckStatus.BENIGN)
  })

  it('the same pair without verification is AWAITING_VERIFICATION, never BENIGN', () => {
    expect(deriveCheckState({ events, attestation: UNVERIFIED_ATTESTATION, headBlock: '47445100' })).toBe(
      CheckStatus.AWAITING_VERIFICATION,
    )
  })

  it('the live proposal alone is SUBMITTED', () => {
    const proposalOnly = events.filter((event) => event.type === CheckEventType.PLAIN_PROPOSED)
    expect(deriveCheckState({ events: proposalOnly, attestation: UNVERIFIED_ATTESTATION, headBlock: '47445100' })).toBe(
      CheckStatus.SUBMITTED,
    )
  })
})
