import { keccak256, type Result } from 'ethers'
import { TOPICS, type TopicDispatch } from '../abi'
import { CheckEventType, OracleGeneration, type CheckEventBase, type Hex, type NormalizedCheckEvent } from '../types'

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

/** Unpack the V3 `SafeId.T` (`chainId << 160 | safe`) into its two parts. */
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

const normalize = (dispatch: TopicDispatch, args: Result, log: RawLog): NormalizedCheckEvent | null => {
  const base: CheckEventBase = {
    blockNumber: log.blockNumber,
    logIndex: log.logIndex,
    transactionHash: log.transactionHash,
    generation: dispatch.generation,
  }

  const isV3 = dispatch.generation === OracleGeneration.V3

  switch (dispatch.type) {
    case CheckEventType.ORACLE_PROPOSED: {
      // V3 has no top-level chainId/safe; the transaction tuple carries both.
      const chainId = isV3 ? str(args.transaction.chainId) : str(args.chainId)
      const safe = isV3 ? (args.transaction.safe as string) : (args.safe as string)
      return {
        ...base,
        type: CheckEventType.ORACLE_PROPOSED,
        safeTxHash: args.safeTxHash as Hex,
        chainId,
        safe,
        epoch: str(args.epoch),
        oracle: args.oracle as string,
        oracleDataHash: isV3 ? (keccak256(args.oracleData as string) as Hex) : null,
      }
    }
    case CheckEventType.ORACLE_ATTESTED: {
      // V3 packs chainId+safe into safeId; the tuple is not in this event.
      const id = isV3 ? unpackSafeId(args.safeId as string) : { chainId: str(args.chainId), safe: args.safe as string }
      return {
        ...base,
        type: CheckEventType.ORACLE_ATTESTED,
        safeTxHash: args.safeTxHash as Hex,
        chainId: id.chainId,
        safe: id.safe,
        epoch: str(args.epoch),
        oracle: args.oracle as string,
        signatureId: args.signatureId as Hex,
        attestation: {
          r: { x: str(args.attestation.r.x), y: str(args.attestation.r.y) },
          z: str(args.attestation.z),
        },
        oracleDataHash: isV3 ? (args.oracleDataHash as Hex) : null,
      }
    }
    case CheckEventType.PLAIN_PROPOSED:
      return {
        ...base,
        type: CheckEventType.PLAIN_PROPOSED,
        safeTxHash: args.safeTxHash as Hex,
        chainId: str(args.chainId),
        safe: args.safe as string,
        epoch: str(args.epoch),
      }
    case CheckEventType.PLAIN_ATTESTED:
      return {
        ...base,
        type: CheckEventType.PLAIN_ATTESTED,
        safeTxHash: args.safeTxHash as Hex,
        chainId: str(args.chainId),
        safe: args.safe as string,
        epoch: str(args.epoch),
        signatureId: args.signatureId as Hex,
        attestation: {
          r: { x: str(args.attestation.r.x), y: str(args.attestation.r.y) },
          z: str(args.attestation.z),
        },
      }
    case CheckEventType.REQUEST_CREATED: {
      if (dispatch.generation === OracleGeneration.V1) {
        return {
          ...base,
          type: CheckEventType.REQUEST_CREATED,
          requestId: args.requestId as Hex,
          proposer: args.proposer as string,
          fee: str(args.fee),
          bondTarget: str(args.bondTarget),
          deadlineBlock: str(args.deadline),
          commitDeadlineBlock: null,
        }
      }
      // V2 and V3 share the commit/reveal shape; V3 renames proposer → sponsor.
      return {
        ...base,
        type: CheckEventType.REQUEST_CREATED,
        requestId: args.requestId as Hex,
        proposer: (isV3 ? args.sponsor : args.proposer) as string,
        fee: str(args.fee),
        bondTarget: str(args.bondTarget),
        deadlineBlock: str(args.revealDeadline),
        commitDeadlineBlock: str(args.commitDeadline),
      }
    }
    case CheckEventType.SENTINEL_COMMITTED: {
      const isV1 = dispatch.generation === OracleGeneration.V1
      return {
        ...base,
        type: CheckEventType.SENTINEL_COMMITTED,
        requestId: args.requestId as Hex,
        sentinel: args.sentinel as string,
        bondAmount: str(args.bondAmount),
        approved: isV1 ? Boolean(args.approved) : null,
        position: isV1 ? str(args.position) : null,
      }
    }
    case CheckEventType.SENTINEL_REVEALED:
      return {
        ...base,
        type: CheckEventType.SENTINEL_REVEALED,
        requestId: args.requestId as Hex,
        sentinel: args.sentinel as string,
        approved: Boolean(args.approved),
        bondAmount: str(args.bondAmount),
        reason: args.reason as string,
      }
    case CheckEventType.ORACLE_RESULT:
      return {
        ...base,
        type: CheckEventType.ORACLE_RESULT,
        requestId: args.requestId as Hex,
        proposer: args.proposer as string,
        approved: Boolean(args.approved),
        result: args.result as Hex,
      }
    case CheckEventType.DISPUTE_RESOLVED:
      return {
        ...base,
        type: CheckEventType.DISPUTE_RESOLVED,
        requestId: args.requestId as Hex,
        outcome: Number(args.outcome),
        slashed: str(args.slashed),
      }
    default:
      return null
  }
}
