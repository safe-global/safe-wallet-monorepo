import {
  AttestationVerificationStatus,
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import {
  arbitrationTimedOutEvent,
  attestedEvent,
  buildBenignSnapshot,
  buildSnapshot,
  disputeTriggeredEvent,
  requestCreatedEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'

export const STORY_SAFE_TX_HASH = `0x${'cd'.repeat(32)}` as const
export const STORY_CHAIN_ID = '1'
export const STORY_SUBMITTED_AT = 1_770_000_000_000

type Vote = string | null

const sentinel = (index: number) => `0x${String(index + 1).padStart(40, '0')}`

const reveals = (votes: Vote[]) =>
  votes.map((reason, index) =>
    sentinelRevealedEvent({
      sentinel: sentinel(index),
      approved: reason === null,
      reason: reason ?? '',
      blockNumber: 48_600_000 + index,
      logIndex: 0,
    }),
  )

/** Votes from the live Gnosis examples (2026-10-06); `null` approves, `unrecognised` is illustrative. */
export const SAFENET_EXAMPLE_VOTES = {
  settingsChange: ['R-4.1', 'R-4.1'],
  delegateCallAndSettings: ['R-4.2', 'R-4.2', 'R-4.1'],
  delegateCall: ['R-4.2', 'R-4.2'],
  approvalAndSpender: ['R-4.5', 'R-4.5', 'R-4.4', 'R-4.5'],
  excessiveApproval: ['R-4.5', 'R-4.5', 'R-4.5'],
  blocklisted: ['R-4.6'],
  councilDenial: [null, 'R-4.1'],
  openDispute: [null, 'R-4.3'],
  unrecognised: ['R-9.9', 'R-9.9'],
} satisfies Record<string, Vote[]>

export const exampleSnapshot = (
  status: Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>,
  over: Partial<SafenetCheckSnapshot> = {},
): SafenetCheckSnapshot => {
  if (status === CheckStatus.BENIGN) {
    const attested = attestedEvent({ safeTxHash: STORY_SAFE_TX_HASH })
    return buildBenignSnapshot({
      safeTxHash: STORY_SAFE_TX_HASH,
      events: [attested],
      attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: attested.signatureId, message: null },
      ...over,
    })
  }
  return buildSnapshot({ safeTxHash: STORY_SAFE_TX_HASH, status, attestedAtMs: null, ...over })
}

export const rejectedSnapshot = (votes: Vote[], status = CheckStatus.MALICIOUS): SafenetCheckSnapshot =>
  exampleSnapshot(status as Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, { events: reveals(votes) })

/** In progress with head and reveal deadline blocks set (for story fixtures). */
export const inProgressWithDeadline = (): SafenetCheckSnapshot =>
  exampleSnapshot(CheckStatus.IN_PROGRESS, {
    headBlock: '48600000',
    deadlineBlock: '48600024',
    events: [requestCreatedEvent({ blockNumber: 48_599_976, deadlineBlock: '48600024' })],
  })

const DISPUTE_REQUEST_ID = `0x${'ef'.repeat(32)}` as const
const DISPUTE_DEADLINE_BLOCK = '49322741'

/** Example #8: the sentinels split and the dispute is open, with about 28 days of arbitration ahead. */
export const openDisputeSnapshot = (): SafenetCheckSnapshot =>
  exampleSnapshot(CheckStatus.DISPUTED, {
    headBlock: '48838950',
    deadlineBlock: DISPUTE_DEADLINE_BLOCK,
    events: [
      ...reveals(SAFENET_EXAMPLE_VOTES.openDispute),
      disputeTriggeredEvent({
        requestId: DISPUTE_REQUEST_ID,
        blockNumber: 48_838_901,
        deadlineBlock: DISPUTE_DEADLINE_BLOCK,
      }),
    ],
  })

/** Example #8 once arbitration ended without a ruling. */
export const timedOutDisputeSnapshot = (): SafenetCheckSnapshot => {
  const open = openDisputeSnapshot()
  return exampleSnapshot(CheckStatus.TIMED_OUT, {
    headBlock: '49322750',
    deadlineBlock: open.deadlineBlock,
    events: [...open.events, arbitrationTimedOutEvent({ requestId: DISPUTE_REQUEST_ID, blockNumber: 49_322_742 })],
  })
}
