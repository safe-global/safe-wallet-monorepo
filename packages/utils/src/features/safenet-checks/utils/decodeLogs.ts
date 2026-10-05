import { keccak256, type Result } from 'ethers'
import { TOPICS, type TopicDispatch } from '../abi'
import { CheckEventType, type CheckEventBase, type Hex, type NormalizedCheckEvent } from '../types'

/** A raw EVM log, as returned by `eth_getLogs` (ethers `Log`-shaped). */
export type RawLog = {
  address?: string
  topics: ReadonlyArray<string>
  data: string
  blockNumber: number
  logIndex: number
  transactionHash: string
}

const str = (value: unknown): string => (typeof value === 'bigint' ? value.toString() : String(value))

const ADDRESS_MASK = (1n << 160n) - 1n

/** Unpack a `SafeId.T` (`chainId << 160 | safe`) into its two parts. */
const unpackSafeId = (safeId: string): { chainId: string; safe: string } => {
  const packed = BigInt(safeId)
  return {
    chainId: (packed >> 160n).toString(),
    safe: `0x${(packed & ADDRESS_MASK).toString(16).padStart(40, '0')}`,
  }
}

/**
 * Decode raw Safenet logs into normalized, Redux-serializable events.
 *
 * Pure and total: unknown topics are skipped and any malformed log is dropped
 * rather than throwing, so a single bad log can never break a poll. Order is
 * preserved from the input; callers sort by (blockNumber, logIndex).
 */
export const decodeLogs = (logs: ReadonlyArray<RawLog>): NormalizedCheckEvent[] => {
  const events: NormalizedCheckEvent[] = []
  for (const log of logs) {
    const event = decodeOne(log)
    if (event) events.push(event)
  }
  return events
}

const decodeOne = (log: RawLog): NormalizedCheckEvent | null => {
  try {
    const topic0 = log.topics[0]
    if (!topic0) return null
    const dispatch = TOPICS[topic0]
    if (!dispatch) return null
    const parsed = dispatch.iface.parseLog({ topics: [...log.topics], data: log.data })
    if (!parsed) return null
    return normalize(dispatch, parsed.args, log)
  } catch {
    return null
  }
}

type Normalizer = (args: Result, base: CheckEventBase) => NormalizedCheckEvent

const frostSignature = (args: Result) => ({
  r: { x: str(args.attestation.r.x), y: str(args.attestation.r.y) },
  z: str(args.attestation.z),
})

// ethers throws on access to a string whose bytes are not UTF-8.
const stringOrNull = (args: Result, name: string): string | null => {
  try {
    return args[name] as string
  } catch {
    return null
  }
}

/** One normalizer per event type; the dispatch table in `abi.ts` selects it. */
const NORMALIZERS: Record<CheckEventType, Normalizer> = {
  // The event has no top-level chainId/safe; the transaction tuple carries both.
  [CheckEventType.ORACLE_PROPOSED]: (args, base) => ({
    ...base,
    type: CheckEventType.ORACLE_PROPOSED,
    safeTxHash: args.safeTxHash as Hex,
    chainId: str(args.transaction.chainId),
    safe: args.transaction.safe as string,
    epoch: str(args.epoch),
    oracle: args.oracle as string,
    oracleDataHash: keccak256(args.oracleData as string) as Hex,
  }),
  // The attested event carries no transaction tuple; safeId packs chainId+safe.
  [CheckEventType.ORACLE_ATTESTED]: (args, base) => {
    const id = unpackSafeId(args.safeId as string)
    return {
      ...base,
      type: CheckEventType.ORACLE_ATTESTED,
      safeTxHash: args.safeTxHash as Hex,
      chainId: id.chainId,
      safe: id.safe,
      epoch: str(args.epoch),
      oracle: args.oracle as string,
      signatureId: args.signatureId as Hex,
      attestation: frostSignature(args),
      oracleDataHash: args.oracleDataHash as Hex,
    }
  },
  [CheckEventType.PLAIN_PROPOSED]: (args, base) => ({
    ...base,
    type: CheckEventType.PLAIN_PROPOSED,
    safeTxHash: args.safeTxHash as Hex,
    chainId: str(args.chainId),
    safe: args.safe as string,
    epoch: str(args.epoch),
  }),
  [CheckEventType.PLAIN_ATTESTED]: (args, base) => ({
    ...base,
    type: CheckEventType.PLAIN_ATTESTED,
    safeTxHash: args.safeTxHash as Hex,
    chainId: str(args.chainId),
    safe: args.safe as string,
    epoch: str(args.epoch),
    signatureId: args.signatureId as Hex,
    attestation: frostSignature(args),
  }),
  [CheckEventType.REQUEST_CREATED]: (args, base) => ({
    ...base,
    type: CheckEventType.REQUEST_CREATED,
    requestId: args.requestId as Hex,
    proposer: args.sponsor as string,
    fee: str(args.fee),
    bondTarget: str(args.bondTarget),
    deadlineBlock: str(args.revealDeadline),
    commitDeadlineBlock: str(args.commitDeadline),
  }),
  [CheckEventType.SENTINEL_COMMITTED]: (args, base) => ({
    ...base,
    type: CheckEventType.SENTINEL_COMMITTED,
    requestId: args.requestId as Hex,
    sentinel: args.sentinel as string,
    bondAmount: str(args.bondAmount),
  }),
  [CheckEventType.SENTINEL_REVEALED]: (args, base) => ({
    ...base,
    type: CheckEventType.SENTINEL_REVEALED,
    requestId: args.requestId as Hex,
    sentinel: args.sentinel as string,
    approved: Boolean(args.approved),
    bondAmount: str(args.bondAmount),
    reason: stringOrNull(args, 'reason'),
  }),
  [CheckEventType.ORACLE_RESULT]: (args, base) => ({
    ...base,
    type: CheckEventType.ORACLE_RESULT,
    requestId: args.requestId as Hex,
    proposer: args.sponsor as string,
    approved: Boolean(args.approved),
    result: args.result as Hex,
  }),
  [CheckEventType.DISPUTE_TRIGGERED]: (args, base) => ({
    ...base,
    type: CheckEventType.DISPUTE_TRIGGERED,
    requestId: args.requestId as Hex,
    arbitrationDeadlineBlock: str(args.deadline),
  }),
  [CheckEventType.DISPUTE_RESOLVED]: (args, base) => ({
    ...base,
    type: CheckEventType.DISPUTE_RESOLVED,
    requestId: args.requestId as Hex,
    outcome: Number(args.outcome),
    slashed: str(args.slashed),
    context: stringOrNull(args, 'context'),
  }),
  [CheckEventType.DISPUTE_OUT_OF_SCOPE]: (args, base) => ({
    ...base,
    type: CheckEventType.DISPUTE_OUT_OF_SCOPE,
    requestId: args.requestId as Hex,
    context: stringOrNull(args, 'context'),
  }),
  [CheckEventType.ARBITRATION_TIMED_OUT]: (args, base) => ({
    ...base,
    type: CheckEventType.ARBITRATION_TIMED_OUT,
    requestId: args.requestId as Hex,
  }),
  [CheckEventType.REQUEST_TIMED_OUT]: (args, base) => ({
    ...base,
    type: CheckEventType.REQUEST_TIMED_OUT,
    requestId: args.requestId as Hex,
  }),
}

const normalize = (dispatch: TopicDispatch, args: Result, log: RawLog): NormalizedCheckEvent =>
  NORMALIZERS[dispatch.type](args, {
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
    transactionHash: log.transactionHash,
  })
