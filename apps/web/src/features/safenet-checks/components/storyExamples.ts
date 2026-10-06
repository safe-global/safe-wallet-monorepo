import {
  AttestationVerificationStatus,
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import {
  attestedEvent,
  buildBenignSnapshot,
  buildSnapshot,
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

/** 24 blocks of 5s before the reveal deadline: "up to about 2 min". */
export const inProgressWithDeadline = (): SafenetCheckSnapshot =>
  exampleSnapshot(CheckStatus.IN_PROGRESS, { headBlock: '48600000', deadlineBlock: '48600024' })

/** No blocks known, started 3 min before the story renders: the elapsed fallback. */
export const inProgressElapsed = (): SafenetCheckSnapshot =>
  exampleSnapshot(CheckStatus.IN_PROGRESS, { aimedAtMs: Date.now() - 3 * 60_000 - 5_000 })
