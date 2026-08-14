import { Interface } from 'ethers'
import { CheckEventType, OracleGeneration } from './types'

/**
 * Event fragments copied verbatim from the protocol repo (Consensus:
 * `explorer/src/lib/consensus/abi.ts`; sentinel V1/V2: the
 * `SentinelOracle{Requests,Commitments}(V2)` libraries; shared: `IOracle.sol`).
 * The V1/V2 `NewRequest`/`Committed` signatures differ, so their topic0s
 * disambiguate the generation; `OracleResult`/`DisputeResolved` are identical
 * across generations and live in one shared bucket.
 */

const TX_TUPLE =
  '(uint256 chainId, address safe, address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 nonce)'
const FROST_SIG_TUPLE = '((uint256 x, uint256 y) r, uint256 z)'

export const CONSENSUS_EVENT_FRAGMENTS = [
  `event OracleTransactionProposed(bytes32 indexed safeTxHash, uint256 indexed chainId, address indexed safe, uint64 epoch, address oracle, ${TX_TUPLE} transaction)`,
  `event OracleTransactionAttested(bytes32 indexed safeTxHash, uint256 indexed chainId, address indexed safe, uint64 epoch, address oracle, bytes32 signatureId, ${FROST_SIG_TUPLE} attestation)`,
] as const

/**
 * The non-oracle Consensus events — what live beta traffic emits: the validator
 * set runs its own deterministic checks and attests, no sentinel oracle in the
 * loop. Same shape as the oracle pair minus `oracle`, hence distinct topic0s.
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

/** Read (view) functions the reader calls, from the protocol explorer's ABIs. */
export const CONSENSUS_READ_ABI = ['function getEpochGroupId(uint64 epoch) view returns (bytes32 groupId)'] as const

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

/** Consensus event topic0s — indexed by `safeTxHash` (topic1). */
export const CONSENSUS_TOPIC0S: readonly string[] = EVENT_DISPATCH.filter(
  (dispatch) => dispatch.iface === consensusInterface || dispatch.iface === consensusPlainInterface,
).map(topicHashOf)

/** Sentinel/oracle event topic0s — indexed by `requestId` (topic1). */
export const SENTINEL_TOPIC0S: readonly string[] = EVENT_DISPATCH.filter(
  (dispatch) => dispatch.iface !== consensusInterface && dispatch.iface !== consensusPlainInterface,
).map(topicHashOf)
