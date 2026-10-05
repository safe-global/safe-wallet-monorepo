import { attestedEvent, buildRequestSnapshot } from '../../builders'
import {
  AttestationVerificationStatus as Attestation,
  CheckStatus,
  type AttestationVerification,
  type CheckEventBase,
  type Hex,
  type OracleAttestedEvent,
  type RequestOutcome,
  type RequestSnapshot,
} from '../../types'
import { deriveCheckState, type DerivedCheckState } from '../deriveCheckState'

const hex = (n: number): Hex => `0x${n.toString(16).padStart(64, '0')}`

const at = (blockNumber: number, logIndex = 0): CheckEventBase => ({
  blockNumber,
  logIndex,
  transactionHash: hex(blockNumber * 1_000 + logIndex),
})

const attestedAt = (blockNumber: number, logIndex = 0): OracleAttestedEvent => attestedEvent(at(blockNumber, logIndex))

const verification = (status: Attestation, id = 1): AttestationVerification => ({
  status,
  signatureId: hex(id + 0x100),
  message: hex(id),
})

const withAttestation = (status: Attestation, id = 1): Partial<RequestSnapshot> => ({
  attestation: verification(status, id),
})

const OUTCOME_SHAPES: Record<RequestOutcome, Partial<RequestSnapshot>> = {
  PENDING: { state: 'PENDING' },
  APPROVED: { state: 'RESOLVED_APPROVED', committedCount: 2, revealedCount: 2, approveCount: 2 },
  DENIED: { state: 'RESOLVED_DENIED', committedCount: 2, revealedCount: 2, denyCount: 2 },
  DISPUTED: {
    state: 'FROZEN',
    committedCount: 2,
    revealedCount: 2,
    approveCount: 1,
    denyCount: 1,
    arbitrationDeadlineBlock: '400',
  },
  RULED_SECURE: {
    state: 'RESOLVED_APPROVED',
    committedCount: 3,
    revealedCount: 3,
    approveCount: 2,
    denyCount: 1,
    resolution: 'COUNCIL',
  },
  RULED_INSECURE: {
    state: 'RESOLVED_DENIED',
    committedCount: 3,
    revealedCount: 3,
    approveCount: 1,
    denyCount: 2,
    resolution: 'COUNCIL',
  },
  NO_RULING: {
    state: 'TIMED_OUT',
    committedCount: 2,
    revealedCount: 2,
    approveCount: 1,
    denyCount: 1,
    resolution: 'ARBITRATION_TIMEOUT',
  },
  TIMED_OUT: { state: 'TIMED_OUT', resolution: 'REQUEST_TIMEOUT' },
}

const request = (id: number, outcome: RequestOutcome, over: Partial<RequestSnapshot> = {}): RequestSnapshot =>
  buildRequestSnapshot({ requestId: hex(id), outcome, ...OUTCOME_SHAPES[outcome], ...over })

const verifiedApproval = (id: number, over: Partial<RequestSnapshot> = {}): RequestSnapshot =>
  request(id, 'APPROVED', { ...withAttestation(Attestation.VERIFIED, id), attestedEvent: attestedAt(150), ...over })

const derive = (...requests: RequestSnapshot[]): DerivedCheckState => deriveCheckState({ requests })

const decidedBy = (decider: RequestSnapshot, status: CheckStatus): DerivedCheckState => ({
  status,
  requestId: decider.requestId,
  outcome: decider.outcome,
})

type SingleRequestCase = [label: string, outcome: RequestOutcome, over: Partial<RequestSnapshot>, status: CheckStatus]

const SINGLE_REQUEST_CASES: SingleRequestCase[] = [
  ['a pending request without commits', 'PENDING', {}, CheckStatus.SUBMITTED],
  ['a pending request with commits', 'PENDING', { committedCount: 2 }, CheckStatus.IN_PROGRESS],
  ['an approval not yet attested', 'APPROVED', withAttestation(Attestation.UNVERIFIED), CheckStatus.IN_PROGRESS],
  [
    'an approval awaiting its group key',
    'APPROVED',
    withAttestation(Attestation.PENDING),
    CheckStatus.AWAITING_VERIFICATION,
  ],
  [
    'an approval failing verification',
    'APPROVED',
    withAttestation(Attestation.INVALID),
    CheckStatus.VERIFICATION_FAILED,
  ],
  ['an approval with a verified attestation', 'APPROVED', withAttestation(Attestation.VERIFIED), CheckStatus.BENIGN],
  ['a unanimous denial', 'DENIED', {}, CheckStatus.MALICIOUS],
  ['a Council insecure ruling', 'RULED_INSECURE', {}, CheckStatus.MALICIOUS],
  ['a Council insecure ruling with no terminal log', 'RULED_INSECURE', { resolution: null }, CheckStatus.MALICIOUS],
  ['an open dispute', 'DISPUTED', {}, CheckStatus.IN_PROGRESS],
  ['a mixed-vote Council secure ruling', 'RULED_SECURE', {}, CheckStatus.UNAVAILABLE],
  ['a Council secure ruling with no terminal log', 'RULED_SECURE', { resolution: null }, CheckStatus.UNAVAILABLE],
  ['a dispute closed out of scope', 'NO_RULING', { resolution: 'OUT_OF_SCOPE' }, CheckStatus.UNAVAILABLE],
  [
    'a dispute closed by arbitration timeout',
    'NO_RULING',
    { resolution: 'ARBITRATION_TIMEOUT' },
    CheckStatus.UNAVAILABLE,
  ],
  ['a no-ruling close with no terminal log', 'NO_RULING', { resolution: null }, CheckStatus.UNAVAILABLE],
  ['a request timed out without reveals', 'TIMED_OUT', { resolution: 'REQUEST_TIMEOUT' }, CheckStatus.TIMED_OUT],
  ['a timeout with no terminal log', 'TIMED_OUT', { resolution: null }, CheckStatus.TIMED_OUT],
]

describe('deriveCheckState — one request', () => {
  it('has no deciding request when nothing was requested', () => {
    expect(deriveCheckState({ requests: [] })).toEqual({
      status: CheckStatus.UNAVAILABLE,
      requestId: null,
      outcome: null,
    })
  })

  it.each(SINGLE_REQUEST_CASES)('%s', (_label, outcome, over, status) => {
    const only = request(1, outcome, over)

    expect(derive(only)).toEqual(decidedBy(only, status))
  })

  it.each(SINGLE_REQUEST_CASES.filter(([, outcome]) => outcome !== 'APPROVED'))(
    '%s is not turned BENIGN by an attached verified attestation',
    (_label, outcome, over, status) => {
      const only = request(1, outcome, { ...over, ...withAttestation(Attestation.VERIFIED) })

      expect(derive(only)).toEqual(decidedBy(only, status))
    },
  )

  it('reads a mixed-vote Council secure ruling as UNAVAILABLE, even with a verified attestation attached', () => {
    const ruled = request(1, 'RULED_SECURE', withAttestation(Attestation.VERIFIED))

    expect(derive(ruled)).toEqual({ status: CheckStatus.UNAVAILABLE, requestId: hex(1), outcome: 'RULED_SECURE' })
  })
})

describe.each<[string, [number, number, number, number]]>([
  ['oldest first', [100, 200, 300, 400]],
  ['newest first', [400, 300, 200, 100]],
])('deriveCheckState — precedence with requests proposed %s', (_order, [denial, dispute, approval, pending]) => {
  const ladder = (): RequestSnapshot[] => [
    request(4, 'DENIED', { proposedAt: at(denial) }),
    request(3, 'DISPUTED', { proposedAt: at(dispute) }),
    verifiedApproval(2, { proposedAt: at(approval) }),
    request(1, 'PENDING', { proposedAt: at(pending) }),
  ]

  it.each<[number, string, CheckStatus]>([
    [0, 'a denial', CheckStatus.MALICIOUS],
    [1, 'an open dispute', CheckStatus.IN_PROGRESS],
    [2, 'a verified approval', CheckStatus.BENIGN],
    [3, 'the latest remaining request', CheckStatus.SUBMITTED],
  ])('rank %i: %s decides over everything ranked below it', (rank, _what, status) => {
    const requests = ladder().slice(rank)

    expect(derive(...requests)).toEqual(decidedBy(requests[0], status))
  })
})

describe('deriveCheckState — siblings', () => {
  it.each<RequestOutcome>(['DENIED', 'RULED_INSECURE'])(
    'a %s request outranks an older verified approval and an older open dispute',
    (outcome) => {
      const risk = request(5, outcome, { proposedAt: at(300) })
      const siblings = [verifiedApproval(1, { proposedAt: at(100) }), request(2, 'DISPUTED', { proposedAt: at(200) })]

      expect(derive(...siblings, risk)).toEqual(decidedBy(risk, CheckStatus.MALICIOUS))
    },
  )

  it('a newer permissionless pending proposal cannot hide an older denial', () => {
    const denied = request(1, 'DENIED', { proposedAt: at(100) })
    const newer = request(2, 'PENDING', { proposedAt: at(200) })

    expect(derive(newer, denied)).toEqual(decidedBy(denied, CheckStatus.MALICIOUS))
  })

  it('a newer permissionless pending proposal cannot hide an older open dispute', () => {
    const disputed = request(1, 'DISPUTED', { proposedAt: at(100) })
    const newer = request(2, 'PENDING', { proposedAt: at(200) })

    expect(derive(newer, disputed)).toEqual(decidedBy(disputed, CheckStatus.IN_PROGRESS))
  })

  it('an older verified approval beats a newer pending request', () => {
    const approved = verifiedApproval(1, { proposedAt: at(100) })
    const newer = request(2, 'PENDING', { proposedAt: at(200) })

    expect(derive(newer, approved)).toEqual(decidedBy(approved, CheckStatus.BENIGN))
  })

  it.each([Attestation.UNVERIFIED, Attestation.PENDING, Attestation.INVALID])(
    'an approval with a %s attestation never borrows the verification of a sibling',
    (status) => {
      const verified = verifiedApproval(1, { proposedAt: at(100) })
      const newer = request(2, 'APPROVED', { proposedAt: at(200), ...withAttestation(status, 2) })

      expect(derive(newer, verified)).toEqual(decidedBy(verified, CheckStatus.BENIGN))
    },
  )
})

describe.each<[string, RequestOutcome, CheckStatus]>([
  ['a denial', 'DENIED', CheckStatus.MALICIOUS],
  ['a Council insecure ruling', 'RULED_INSECURE', CheckStatus.MALICIOUS],
  ['an open dispute', 'DISPUTED', CheckStatus.IN_PROGRESS],
])('deriveCheckState — several requests with %s', (_label, outcome, status) => {
  it('decides on the earliest known proposal', () => {
    const earliest = request(9, outcome, { proposedAt: at(100) })
    const later = request(1, outcome, { proposedAt: at(200) })

    expect(derive(later, earliest)).toEqual(decidedBy(earliest, status))
  })

  it('breaks a same-block tie on the log index', () => {
    const earliest = request(9, outcome, { proposedAt: at(100, 1) })
    const later = request(1, outcome, { proposedAt: at(100, 5) })

    expect(derive(later, earliest)).toEqual(decidedBy(earliest, status))
  })

  it('ranks the earlier block ahead of a lower log index in a later block', () => {
    const earliest = request(9, outcome, { proposedAt: at(100, 9) })
    const later = request(1, outcome, { proposedAt: at(200, 1) })

    expect(derive(later, earliest)).toEqual(decidedBy(earliest, status))
  })

  it('breaks a full tie on the lexical request id', () => {
    const first = request(1, outcome, { proposedAt: at(100) })
    const second = request(2, outcome, { proposedAt: at(100) })

    expect(derive(second, first)).toEqual(decidedBy(first, status))
  })

  it('ranks an unknown proposal position after every known one', () => {
    const unknown = request(1, outcome, { proposedAt: null })
    const known = request(9, outcome, { proposedAt: at(500) })

    expect(derive(unknown, known)).toEqual(decidedBy(known, status))
  })

  it('orders unknown proposal positions by request id', () => {
    const first = request(1, outcome, { proposedAt: null })
    const second = request(2, outcome, { proposedAt: null })

    expect(derive(second, first)).toEqual(decidedBy(first, status))
  })
})

describe('deriveCheckState — a denial and a Council insecure ruling together', () => {
  it.each<[RequestOutcome, RequestOutcome]>([
    ['DENIED', 'RULED_INSECURE'],
    ['RULED_INSECURE', 'DENIED'],
  ])('the earlier proposal decides, whether it is %s or later %s', (earlierOutcome, laterOutcome) => {
    const earlier = request(9, earlierOutcome, { proposedAt: at(100) })
    const later = request(1, laterOutcome, { proposedAt: at(200) })

    expect(derive(later, earlier)).toEqual(decidedBy(earlier, CheckStatus.MALICIOUS))
  })
})

describe('deriveCheckState — several verified approvals', () => {
  it.each<[string, number, number]>([
    ['proposed first', 100, 200],
    ['proposed last', 200, 100],
  ])('decides on the newest attested event, whichever request was %s', (_order, newestProposal, olderProposal) => {
    const newest = verifiedApproval(9, { proposedAt: at(newestProposal), attestedEvent: attestedAt(300) })
    const older = verifiedApproval(1, { proposedAt: at(olderProposal), attestedEvent: attestedAt(250) })

    expect(derive(older, newest)).toEqual(decidedBy(newest, CheckStatus.BENIGN))
  })

  it('breaks a same-block tie on the attested log index', () => {
    const newest = verifiedApproval(9, { attestedEvent: attestedAt(300, 7) })
    const older = verifiedApproval(1, { attestedEvent: attestedAt(300, 2) })

    expect(derive(older, newest)).toEqual(decidedBy(newest, CheckStatus.BENIGN))
  })

  it('ranks the later attested block ahead of a higher log index in an earlier block', () => {
    const newest = verifiedApproval(9, { attestedEvent: attestedAt(300, 1) })
    const older = verifiedApproval(1, { attestedEvent: attestedAt(250, 9) })

    expect(derive(older, newest)).toEqual(decidedBy(newest, CheckStatus.BENIGN))
  })

  it('breaks a tie of attested positions on the lexical request id', () => {
    const first = verifiedApproval(1, { attestedEvent: attestedAt(300) })
    const second = verifiedApproval(2, { attestedEvent: attestedAt(300) })

    expect(derive(second, first)).toEqual(decidedBy(first, CheckStatus.BENIGN))
  })

  it('ranks getter-only evidence after any dated attestation', () => {
    const getterOnly = verifiedApproval(1, { attestedEvent: null })
    const dated = verifiedApproval(9, { attestedEvent: attestedAt(10) })

    expect(derive(getterOnly, dated)).toEqual(decidedBy(dated, CheckStatus.BENIGN))
  })

  it('orders getter-only evidence by request id', () => {
    const first = verifiedApproval(1, { attestedEvent: null })
    const second = verifiedApproval(2, { attestedEvent: null })

    expect(derive(second, first)).toEqual(decidedBy(first, CheckStatus.BENIGN))
  })
})

describe('deriveCheckState — several remaining requests', () => {
  it('decides on the latest known proposal', () => {
    const older = request(1, 'PENDING', { proposedAt: at(100) })
    const latest = request(9, 'TIMED_OUT', { proposedAt: at(200) })

    expect(derive(older, latest)).toEqual(decidedBy(latest, CheckStatus.TIMED_OUT))
    expect(derive(latest, older)).toEqual(decidedBy(latest, CheckStatus.TIMED_OUT))
  })

  it('breaks a same-block tie on the log index', () => {
    const older = request(1, 'TIMED_OUT', { proposedAt: at(100, 1) })
    const latest = request(9, 'PENDING', { proposedAt: at(100, 5) })

    expect(derive(older, latest)).toEqual(decidedBy(latest, CheckStatus.SUBMITTED))
  })

  it('ranks the later block ahead of a higher log index in an earlier block', () => {
    const older = request(1, 'TIMED_OUT', { proposedAt: at(100, 9) })
    const latest = request(9, 'PENDING', { proposedAt: at(200, 1) })

    expect(derive(older, latest)).toEqual(decidedBy(latest, CheckStatus.SUBMITTED))
  })

  it('breaks a full tie on the lexical request id', () => {
    const first = request(1, 'PENDING', { proposedAt: at(100) })
    const second = request(2, 'TIMED_OUT', { proposedAt: at(100) })

    expect(derive(second, first)).toEqual(decidedBy(first, CheckStatus.SUBMITTED))
  })

  it('ranks an unknown proposal position after every known one', () => {
    const unknown = request(1, 'PENDING', { proposedAt: null })
    const known = request(9, 'TIMED_OUT', { proposedAt: at(100) })

    expect(derive(unknown, known)).toEqual(decidedBy(known, CheckStatus.TIMED_OUT))
  })

  it('orders all-unknown proposal positions by request id', () => {
    const first = request(2, 'PENDING', { proposedAt: null })
    const second = request(3, 'TIMED_OUT', { proposedAt: null })

    expect(derive(second, first)).toEqual(decidedBy(first, CheckStatus.SUBMITTED))
  })
})

const OUTCOMES = Object.keys(OUTCOME_SHAPES) as RequestOutcome[]

const PRECEDENCE_RANK: Record<RequestOutcome, number> = {
  DENIED: 0,
  RULED_INSECURE: 0,
  DISPUTED: 1,
  APPROVED: 2,
  PENDING: 3,
  RULED_SECURE: 3,
  NO_RULING: 3,
  TIMED_OUT: 3,
}

const OUTCOME_PAIRS: Array<[RequestOutcome, RequestOutcome]> = OUTCOMES.flatMap((a) =>
  OUTCOMES.map((b): [RequestOutcome, RequestOutcome] => [a, b]),
)

const pairRequest = (id: number, outcome: RequestOutcome, proposedBlock: number): RequestSnapshot =>
  outcome === 'APPROVED'
    ? verifiedApproval(id, { proposedAt: at(proposedBlock) })
    : request(id, outcome, { proposedAt: at(proposedBlock) })

describe('deriveCheckState — every pair of outcomes', () => {
  it.each(OUTCOME_PAIRS)('%s next to %s: the highest-precedence request decides and owns the result', (a, b) => {
    const requests = [pairRequest(1, a, 200), pairRequest(2, b, 100)]
    const result = derive(...requests)
    const decider = requests.find(({ requestId }) => requestId === result.requestId)

    expect(decider).toBeDefined()
    expect(result.outcome).toBe(decider?.outcome)
    expect(decider && PRECEDENCE_RANK[decider.outcome]).toBe(Math.min(PRECEDENCE_RANK[a], PRECEDENCE_RANK[b]))
  })

  it.each(OUTCOME_PAIRS)('%s next to %s: the input order does not matter', (a, b) => {
    const requests = [pairRequest(1, a, 200), pairRequest(2, b, 100)]

    expect(derive(...[...requests].reverse())).toEqual(derive(...requests))
  })

  it('accepts a frozen request list without reordering it', () => {
    const late = request(1, 'DENIED', { proposedAt: at(200) })
    const early = request(2, 'DENIED', { proposedAt: at(100) })
    const requests = Object.freeze([late, early])

    expect(deriveCheckState({ requests })).toEqual(decidedBy(early, CheckStatus.MALICIOUS))
    expect(requests).toEqual([late, early])
  })
})
