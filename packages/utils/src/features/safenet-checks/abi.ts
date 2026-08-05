import { Interface } from 'ethers'
import { CheckEventType, OracleGeneration } from './types'

/**
 * Event fragments copied verbatim (field names + types) from the protocol repo:
 *   - Consensus: `explorer/src/lib/consensus/abi.ts` + `validator/src/types/abis.ts`
 *   - V1 sentinel: `contracts/src/libraries/{SentinelOracleRequests,SentinelOracleCommitments}.sol`
 *   - V2 sentinel: `contracts/src/libraries/{SentinelOracleRequestsV2,SentinelOracleCommitmentsV2}.sol`
 *   - Shared: `contracts/src/interfaces/IOracle.sol` + `SentinelOracle(V2).sol`
 *
 * The two generations' `NewRequest`/`Committed` have genuinely different
 * signatures (and therefore different topic0s), which is what lets a single
 * topic0→generation map disambiguate them. `DisputeResolved` and `OracleResult`
 * are identical across generations, so they live in one shared bucket (defining
 * them per-generation would collide on topic0).
 */

const TX_TUPLE =
  '(uint256 chainId, address safe, address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 nonce)'
const FROST_SIG_TUPLE = '((uint256 x, uint256 y) r, uint256 z)'

export const CONSENSUS_EVENT_FRAGMENTS = [
  `event OracleTransactionProposed(bytes32 indexed safeTxHash, uint256 indexed chainId, address indexed safe, uint64 epoch, address oracle, ${TX_TUPLE} transaction)`,
  `event OracleTransactionAttested(bytes32 indexed safeTxHash, uint256 indexed chainId, address indexed safe, uint64 epoch, address oracle, bytes32 signatureId, ${FROST_SIG_TUPLE} attestation)`,
] as const

/**
 * The **non-oracle** Consensus events: same shape as the oracle pair minus the
 * `oracle` field, so they hash to different topic0s. Confirmed 2026-07-28 as
 * what the live Gnosis beta actually emits — in a 10k-block sample the deployed
 * Consensus emitted ~3k `TransactionProposed` / ~2.9k `TransactionAttested` and
 * zero `OracleTransaction*`. The validator set runs its own deterministic checks
 * on this path and attests the result; the sentinel oracle adds richer checks
 * later. Both resolve to `BENIGN` once the FROST signature verifies.
 */
export const CONSENSUS_PLAIN_EVENT_FRAGMENTS = [
  `event TransactionProposed(bytes32 indexed safeTxHash, uint256 indexed chainId, address indexed safe, uint64 epoch, ${TX_TUPLE} transaction)`,
  `event TransactionAttested(bytes32 indexed safeTxHash, uint256 indexed chainId, address indexed safe, uint64 epoch, bytes32 signatureId, ${FROST_SIG_TUPLE} attestation)`,
] as const

export const V1_SENTINEL_EVENT_FRAGMENTS = [
  'event NewRequest(bytes32 indexed requestId, address indexed proposer, uint256 fee, uint256 bondTarget, uint256 deadline)',
  'event Committed(bytes32 indexed requestId, address indexed sentinel, bool approved, uint256 bondAmount, uint256 position)',
] as const

export const V2_SENTINEL_EVENT_FRAGMENTS = [
  'event NewRequest(bytes32 indexed requestId, address indexed proposer, uint256 fee, uint256 bondTarget, uint256 commitDeadline, uint256 revealDeadline)',
  'event Committed(bytes32 indexed requestId, address indexed sentinel, uint256 bondAmount)',
  'event Revealed(bytes32 indexed requestId, address indexed sentinel, bool approved, uint256 bondAmount, string reason)',
] as const

export const SHARED_ORACLE_EVENT_FRAGMENTS = [
  'event OracleResult(bytes32 indexed requestId, address indexed proposer, bytes result, bool approved)',
  'event DisputeResolved(bytes32 indexed requestId, uint8 outcome, uint256 slashed)',
] as const

/**
 * Read (view) functions the reader calls with `ethers.Contract`. Copied from the
 * protocol explorer's `consensus`/`coordinator` ABIs. `getEpochGroupId` maps an
 * epoch to its FROST group id; `groupKey` returns that group's public key;
 * `getCoordinator` discovers the FROSTCoordinator when no override is configured.
 */
export const CONSENSUS_READ_ABI = [
  'function getCoordinator() view returns (address)',
  'function getEpochGroupId(uint64 epoch) view returns (bytes32 groupId)',
] as const

export const COORDINATOR_READ_ABI = [
  'function groupKey(bytes32 gid) view returns ((uint256 x, uint256 y) key)',
] as const

export const consensusInterface = new Interface(CONSENSUS_EVENT_FRAGMENTS)
export const consensusPlainInterface = new Interface(CONSENSUS_PLAIN_EVENT_FRAGMENTS)
export const v1SentinelInterface = new Interface(V1_SENTINEL_EVENT_FRAGMENTS)
export const v2SentinelInterface = new Interface(V2_SENTINEL_EVENT_FRAGMENTS)
export const sharedOracleInterface = new Interface(SHARED_ORACLE_EVENT_FRAGMENTS)

export type TopicDispatch = {
  iface: Interface
  eventName: string
  type: CheckEventType
  generation: OracleGeneration
}

/** One descriptor per decodable event; the source of truth for {@link TOPICS}. */
export const EVENT_DISPATCH: readonly TopicDispatch[] = [
  {
    iface: consensusInterface,
    eventName: 'OracleTransactionProposed',
    type: CheckEventType.ORACLE_PROPOSED,
    generation: OracleGeneration.STABLE,
  },
  {
    iface: consensusInterface,
    eventName: 'OracleTransactionAttested',
    type: CheckEventType.ORACLE_ATTESTED,
    generation: OracleGeneration.STABLE,
  },
  {
    iface: consensusPlainInterface,
    eventName: 'TransactionProposed',
    type: CheckEventType.PLAIN_PROPOSED,
    generation: OracleGeneration.STABLE,
  },
  {
    iface: consensusPlainInterface,
    eventName: 'TransactionAttested',
    type: CheckEventType.PLAIN_ATTESTED,
    generation: OracleGeneration.STABLE,
  },
  {
    iface: v1SentinelInterface,
    eventName: 'NewRequest',
    type: CheckEventType.REQUEST_CREATED,
    generation: OracleGeneration.V1,
  },
  {
    iface: v1SentinelInterface,
    eventName: 'Committed',
    type: CheckEventType.SENTINEL_COMMITTED,
    generation: OracleGeneration.V1,
  },
  {
    iface: v2SentinelInterface,
    eventName: 'NewRequest',
    type: CheckEventType.REQUEST_CREATED,
    generation: OracleGeneration.V2,
  },
  {
    iface: v2SentinelInterface,
    eventName: 'Committed',
    type: CheckEventType.SENTINEL_COMMITTED,
    generation: OracleGeneration.V2,
  },
  {
    iface: v2SentinelInterface,
    eventName: 'Revealed',
    type: CheckEventType.SENTINEL_REVEALED,
    generation: OracleGeneration.V2,
  },
  {
    iface: sharedOracleInterface,
    eventName: 'OracleResult',
    type: CheckEventType.ORACLE_RESULT,
    generation: OracleGeneration.STABLE,
  },
  {
    iface: sharedOracleInterface,
    eventName: 'DisputeResolved',
    type: CheckEventType.DISPUTE_RESOLVED,
    generation: OracleGeneration.STABLE,
  },
]

/** Compute an event's topic0 from its interface + name. */
export const topicHashOf = (dispatch: Pick<TopicDispatch, 'iface' | 'eventName'>): string => {
  const fragment = dispatch.iface.getEvent(dispatch.eventName)
  if (!fragment) throw new Error(`unknown event ${dispatch.eventName}`)
  return fragment.topicHash
}

/** topic0 → dispatch descriptor. Uniqueness is asserted by the abi guard test. */
export const TOPICS: Readonly<Record<string, TopicDispatch>> = Object.freeze(
  Object.fromEntries(EVENT_DISPATCH.map((dispatch) => [topicHashOf(dispatch), dispatch])),
)

/**
 * The two Consensus event topic0s (`OracleTransactionProposed` /
 * `OracleTransactionAttested`) — indexed by `safeTxHash` (topic1). Used as the
 * topic0 filter for the first `getLogs`.
 */
export const CONSENSUS_TOPIC0S: readonly string[] = EVENT_DISPATCH.filter(
  (dispatch) => dispatch.iface === consensusInterface || dispatch.iface === consensusPlainInterface,
).map(topicHashOf)

/**
 * Every sentinel/oracle event topic0 (V1 + V2 `NewRequest`/`Committed`/
 * `Revealed`, plus the shared `OracleResult`/`DisputeResolved`) — all indexed by
 * `requestId` (topic1). Used as the topic0 filter for the second `getLogs`.
 */
export const SENTINEL_TOPIC0S: readonly string[] = EVENT_DISPATCH.filter(
  (dispatch) => dispatch.iface !== consensusInterface && dispatch.iface !== consensusPlainInterface,
).map(topicHashOf)
