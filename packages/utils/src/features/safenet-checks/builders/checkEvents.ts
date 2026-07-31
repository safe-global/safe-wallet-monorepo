import { faker } from '@faker-js/faker'
import {
  CheckEventType,
  OracleGeneration,
  type DisputeResolvedEvent,
  type Hex,
  type OracleAttestedEvent,
  type OracleProposedEvent,
  type OracleResultEvent,
  type PlainAttestedEvent,
  type PlainProposedEvent,
  type RequestCreatedEvent,
  type SentinelCommittedEvent,
  type SentinelRevealedEvent,
} from '../types'

/**
 * Direct `NormalizedCheckEvent` factories for status-machine and merge tests —
 * they build the decoded shape without going through the wire encoding (use the
 * `rawLogs` builders when you need to exercise the decoder itself).
 */

let idx = 0
const hexHash = (): Hex => faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex
const addr = (): string => faker.finance.ethereumAddress()

const base = (
  over?: Partial<{ blockNumber: number; logIndex: number; transactionHash: string; generation: OracleGeneration }>,
) => ({
  blockNumber: over?.blockNumber ?? 100 + idx,
  logIndex: over?.logIndex ?? idx++,
  transactionHash: over?.transactionHash ?? hexHash(),
  generation: over?.generation ?? OracleGeneration.STABLE,
})

export const proposedEvent = (over: Partial<OracleProposedEvent> = {}): OracleProposedEvent => ({
  ...base(over),
  type: CheckEventType.ORACLE_PROPOSED,
  safeTxHash: over.safeTxHash ?? hexHash(),
  chainId: over.chainId ?? '100',
  safe: over.safe ?? addr(),
  epoch: over.epoch ?? '1',
  oracle: over.oracle ?? addr(),
})

export const attestedEvent = (over: Partial<OracleAttestedEvent> = {}): OracleAttestedEvent => ({
  ...base(over),
  type: CheckEventType.ORACLE_ATTESTED,
  safeTxHash: over.safeTxHash ?? hexHash(),
  chainId: over.chainId ?? '100',
  safe: over.safe ?? addr(),
  epoch: over.epoch ?? '1',
  oracle: over.oracle ?? addr(),
  signatureId: over.signatureId ?? hexHash(),
  attestation: over.attestation ?? { r: { x: '1', y: '2' }, z: '3' },
})

export const plainProposedEvent = (over: Partial<PlainProposedEvent> = {}): PlainProposedEvent => ({
  ...base(over),
  type: CheckEventType.PLAIN_PROPOSED,
  safeTxHash: over.safeTxHash ?? hexHash(),
  chainId: over.chainId ?? '100',
  safe: over.safe ?? addr(),
  epoch: over.epoch ?? '1',
})

export const plainAttestedEvent = (over: Partial<PlainAttestedEvent> = {}): PlainAttestedEvent => ({
  ...base(over),
  type: CheckEventType.PLAIN_ATTESTED,
  safeTxHash: over.safeTxHash ?? hexHash(),
  chainId: over.chainId ?? '100',
  safe: over.safe ?? addr(),
  epoch: over.epoch ?? '1',
  signatureId: over.signatureId ?? hexHash(),
  attestation: over.attestation ?? { r: { x: '1', y: '2' }, z: '3' },
})

export const requestCreatedEvent = (over: Partial<RequestCreatedEvent> = {}): RequestCreatedEvent => ({
  ...base({ generation: OracleGeneration.V2, ...over }),
  type: CheckEventType.REQUEST_CREATED,
  requestId: over.requestId ?? hexHash(),
  proposer: over.proposer ?? addr(),
  fee: over.fee ?? '1000',
  bondTarget: over.bondTarget ?? '5000',
  deadlineBlock: over.deadlineBlock ?? '150',
  commitDeadlineBlock: over.commitDeadlineBlock ?? null,
})

export const sentinelCommittedEvent = (over: Partial<SentinelCommittedEvent> = {}): SentinelCommittedEvent => ({
  ...base(over),
  type: CheckEventType.SENTINEL_COMMITTED,
  requestId: over.requestId ?? hexHash(),
  sentinel: over.sentinel ?? addr(),
  bondAmount: over.bondAmount ?? '5000',
  approved: over.approved ?? null,
  position: over.position ?? null,
})

export const sentinelRevealedEvent = (over: Partial<SentinelRevealedEvent> = {}): SentinelRevealedEvent => ({
  ...base({ generation: OracleGeneration.V2, ...over }),
  type: CheckEventType.SENTINEL_REVEALED,
  requestId: over.requestId ?? hexHash(),
  sentinel: over.sentinel ?? addr(),
  approved: over.approved ?? true,
  bondAmount: over.bondAmount ?? '5000',
  reason: over.reason ?? '',
})

export const oracleResultEvent = (over: Partial<OracleResultEvent> = {}): OracleResultEvent => ({
  ...base(over),
  type: CheckEventType.ORACLE_RESULT,
  requestId: over.requestId ?? hexHash(),
  proposer: over.proposer ?? addr(),
  approved: over.approved ?? true,
  result: over.result ?? '0x',
})

export const disputeResolvedEvent = (over: Partial<DisputeResolvedEvent> = {}): DisputeResolvedEvent => ({
  ...base(over),
  type: CheckEventType.DISPUTE_RESOLVED,
  requestId: over.requestId ?? hexHash(),
  outcome: over.outcome ?? 1,
  slashed: over.slashed ?? '0',
})
