import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveCheckState, derivePlainCheckState } from '../deriveCheckState'
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
  UNVERIFIED_ATTESTATION,
  type AttestationVerification,
  type CheckEventBase,
  type Hex,
  type NormalizedCheckEvent,
  type RequestOutcome,
  type RequestSnapshot,
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
) => derivePlainCheckState({ events, headBlock, attestation })

// A request that times out at block 150.
const request = () => requestCreatedEvent({ deadlineBlock: '150', commitDeadlineBlock: '150' })

describe('derivePlainCheckState — precedence table', () => {
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

  it('IN_PROGRESS on commit activity (commits are blind, no verdict yet)', () => {
    const events = [proposedEvent(), request(), sentinelCommittedEvent()]
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

  it('a lone negative reveal is NOT a verdict — the oracle resolves by unanimity', () => {
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

describe('derivePlainCheckState — head == deadline boundary', () => {
  it('stays IN_PROGRESS at head == deadline (reveal window is inclusive)', () => {
    expect(derive([proposedEvent(), request()], '150')).toBe(CheckStatus.IN_PROGRESS)
  })

  it('TIMED_OUT one block later', () => {
    expect(derive([proposedEvent(), request()], '151')).toBe(CheckStatus.TIMED_OUT)
  })
})

describe('derivePlainCheckState — late verdicts beat the deadline', () => {
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

describe('derivePlainCheckState — negative verdict outranks a verified attestation', () => {
  it('MALICIOUS wins over attested+verified when both are present', () => {
    const events = [proposedEvent(), request(), attestedEvent(), oracleResultEvent({ approved: false })]
    expect(derive(events, '140', verification(AttestationVerificationStatus.VERIFIED))).toBe(CheckStatus.MALICIOUS)
  })
})

describe('derivePlainCheckState — order independence', () => {
  it('a reversed event set derives the same status (derive is a fold, not a replay)', () => {
    const events = [proposedEvent(), request(), attestedEvent(), oracleResultEvent({ approved: false })]
    const verified = verification(AttestationVerificationStatus.VERIFIED)
    expect(derive([...events].reverse(), '140', verified)).toBe(derive(events, '140', verified))
    expect(derive([...events].reverse(), '140', verified)).toBe(CheckStatus.MALICIOUS)
  })
})

describe('derivePlainCheckState — live-captured beta logs through the real decoder', () => {
  // The checked-in live pair (an Arbitrum Safe checked on Gnosis beta): decode
  // the actual deployed bytes, then derive — the two slices composed on real data.
  const fixture = JSON.parse(
    readFileSync(join(__dirname, '../../__fixtures__/gnosis-plain-lifecycle.captured.json'), 'utf8'),
  )
  const events = decodeLogs(fixture.logs)

  it('verified live pair resolves BENIGN', () => {
    expect(
      derivePlainCheckState({
        events,
        attestation: verification(AttestationVerificationStatus.VERIFIED),
        headBlock: '47445100',
      }),
    ).toBe(CheckStatus.BENIGN)
  })

  it('the same pair without verification is AWAITING_VERIFICATION, never BENIGN', () => {
    expect(derivePlainCheckState({ events, attestation: UNVERIFIED_ATTESTATION, headBlock: '47445100' })).toBe(
      CheckStatus.AWAITING_VERIFICATION,
    )
  })

  it('the live proposal alone is SUBMITTED', () => {
    const proposalOnly = events.filter((event) => event.type === CheckEventType.PLAIN_PROPOSED)
    expect(
      derivePlainCheckState({ events: proposalOnly, attestation: UNVERIFIED_ATTESTATION, headBlock: '47445100' }),
    ).toBe(CheckStatus.SUBMITTED)
  })
})

const hex = (n: number): Hex => `0x${n.toString(16).padStart(64, '0')}`

const at = (blockNumber: number, logIndex = 0): CheckEventBase => ({ blockNumber, logIndex, transactionHash: hex(0) })

const snapshotOf = (id: number, outcome: RequestOutcome, over: Partial<RequestSnapshot> = {}): RequestSnapshot => ({
  requestId: hex(id),
  epoch: '1',
  oracle: hex(0).slice(0, 42),
  oracleDataHash: hex(0),
  chainId: '1',
  safe: hex(0).slice(0, 42),
  proposedAt: at(100),
  state: 'PENDING',
  outcome,
  commitDeadlineBlock: '150',
  revealDeadlineBlock: '150',
  arbitrationDeadlineBlock: null,
  committedCount: 0,
  revealedCount: 0,
  approveCount: 0,
  denyCount: 0,
  votes: [],
  resolution: null,
  resolutionContext: null,
  resolutionTxHash: null,
  attestation: UNVERIFIED_ATTESTATION,
  attestedEvent: null,
  attestedAtMs: null,
  ...over,
})

const { VERIFIED, PENDING, INVALID } = AttestationVerificationStatus
const { SUBMITTED, IN_PROGRESS, AWAITING_VERIFICATION, VERIFICATION_FAILED, BENIGN, MALICIOUS } = CheckStatus
const withStatus = (status: AttestationVerificationStatus): Partial<RequestSnapshot> => ({
  attestation: verification(status),
})
const verifiedApproval = (id: number, over: Partial<RequestSnapshot> = {}): RequestSnapshot =>
  snapshotOf(id, 'APPROVED', { ...withStatus(VERIFIED), ...over })
const decidedBy = ({ requestId, outcome }: RequestSnapshot, status: CheckStatus) => ({ status, requestId, outcome })

describe('deriveCheckState', () => {
  it('has no deciding request when nothing was requested', () => {
    expect(deriveCheckState({ requests: [] })).toEqual({
      status: CheckStatus.UNAVAILABLE,
      requestId: null,
      outcome: null,
    })
  })

  it.each<[string, RequestOutcome, Partial<RequestSnapshot>, CheckStatus]>([
    ['a pending request', 'PENDING', {}, SUBMITTED],
    ['a pending request with commits', 'PENDING', { committedCount: 1 }, IN_PROGRESS],
    ['an approval without an attestation', 'APPROVED', {}, IN_PROGRESS],
    ['an approval awaiting verification', 'APPROVED', withStatus(PENDING), AWAITING_VERIFICATION],
    ['an approval failing verification', 'APPROVED', withStatus(INVALID), VERIFICATION_FAILED],
    ['a verified approval', 'APPROVED', withStatus(VERIFIED), BENIGN],
    ['a unanimous denial', 'DENIED', {}, MALICIOUS],
    ['a Council insecure ruling', 'RULED_INSECURE', {}, MALICIOUS],
    ['an open dispute', 'DISPUTED', {}, IN_PROGRESS],
    ['a Council secure ruling', 'RULED_SECURE', {}, CheckStatus.UNAVAILABLE],
    ['a verified Council secure ruling', 'RULED_SECURE', withStatus(VERIFIED), CheckStatus.UNAVAILABLE],
    ['a close without a ruling', 'NO_RULING', {}, CheckStatus.UNAVAILABLE],
    ['a timeout', 'TIMED_OUT', {}, CheckStatus.TIMED_OUT],
  ])('maps %s to its coarse status', (_label, outcome, over, status) => {
    const only = snapshotOf(1, outcome, over)

    expect(deriveCheckState({ requests: [only] })).toEqual(decidedBy(only, status))
  })

  const approval = verifiedApproval(1, { proposedAt: at(100) })
  const dispute = snapshotOf(2, 'DISPUTED', { proposedAt: at(200) })
  const denial = (outcome: RequestOutcome) => snapshotOf(3, outcome, { proposedAt: at(300) })
  const newerPending = snapshotOf(5, 'PENDING', { proposedAt: at(900) })

  it.each<[string, RequestSnapshot[], number, CheckStatus]>([
    ['a denial outranks a verified approval and an open dispute', [approval, dispute, denial('DENIED')], 2, MALICIOUS],
    ['a Council insecure ruling outranks them too', [approval, dispute, denial('RULED_INSECURE')], 2, MALICIOUS],
    ['an open dispute outranks a verified approval', [approval, dispute], 1, IN_PROGRESS],
    ['a newer pending request cannot hide an older denial', [denial('DENIED'), newerPending], 0, MALICIOUS],
    ['a newer pending request cannot hide an older dispute', [dispute, newerPending], 0, IN_PROGRESS],
    ['an older verified approval beats a newer pending request', [approval, newerPending], 0, BENIGN],
  ])('%s, in either input order', (_label, requests, winner, status) => {
    for (const input of [requests, [...requests].reverse()]) {
      expect(deriveCheckState({ requests: input })).toEqual(decidedBy(requests[winner], status))
    }
  })

  it('ranks a verified approval without an attested log after a dated one', () => {
    const dated = verifiedApproval(9, { attestedEvent: attestedEvent(at(10)) })
    const undated = verifiedApproval(1, { attestedEvent: null })

    expect(deriveCheckState({ requests: [undated, dated] }).requestId).toBe(dated.requestId)
  })
})

type Make = (id: number, position: CheckEventBase) => RequestSnapshot

describe.each<[string, Make, 'earliest' | 'latest']>([
  ['a denial', (id, position) => snapshotOf(id, 'DENIED', { proposedAt: position }), 'earliest'],
  ['an open dispute', (id, position) => snapshotOf(id, 'DISPUTED', { proposedAt: position }), 'earliest'],
  ['a verified approval', (id, position) => verifiedApproval(id, { attestedEvent: attestedEvent(position) }), 'latest'],
  ['a pending request', (id, position) => snapshotOf(id, 'PENDING', { proposedAt: position }), 'latest'],
])('deriveCheckState — ties between %s requests', (_name, make, decides) => {
  it.each<[string, CheckEventBase, CheckEventBase]>([
    ['an earlier block outranks a lower log index in a later block', at(100, 9), at(200, 1)],
    ['the log index decides inside one block', at(100, 1), at(100, 5)],
  ])('%s', (_label, first, second) => {
    const [winner, loser] =
      decides === 'earliest' ? [make(9, first), make(1, second)] : [make(9, second), make(1, first)]

    expect(deriveCheckState({ requests: [winner, loser] }).requestId).toBe(winner.requestId)
    expect(deriveCheckState({ requests: [loser, winner] }).requestId).toBe(winner.requestId)
  })

  it('breaks an identical position on the lexical request id', () => {
    const [low, high] = [make(1, at(100)), make(2, at(100))]

    expect(deriveCheckState({ requests: [high, low] }).requestId).toBe(low.requestId)
  })
})
