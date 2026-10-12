import { Interface } from 'ethers'
import { CheckEventType } from './types'

const TX_TUPLE =
  '(uint256 chainId, address safe, address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 nonce)'
const FROST_SIG_TUPLE = '((uint256 x, uint256 y) r, uint256 z)'

export const CONSENSUS_EVENT_FRAGMENTS = [
  `event TransactionProposed(bytes32 indexed safeTxHash, bytes32 indexed safeId, address indexed oracle, uint64 epoch, bytes oracleData, ${TX_TUPLE} transaction)`,
  `event TransactionAttested(bytes32 indexed safeTxHash, bytes32 indexed safeId, address indexed oracle, uint64 epoch, bytes32 oracleDataHash, bytes32 signatureId, ${FROST_SIG_TUPLE} attestation)`,
] as const

export const SENTINEL_EVENT_FRAGMENTS = [
  'event NewRequest(bytes32 indexed requestId, address indexed sponsor, uint96 fee, uint96 bondTarget, uint24 daoFeeShare, uint96 slashAmount, uint64 commitDeadline, uint64 revealDeadline)',
  'event Committed(bytes32 indexed requestId, address indexed sentinel, uint96 bondAmount)',
  'event Revealed(bytes32 indexed requestId, address indexed sentinel, bool approved, uint96 bondAmount, string reason)',
  'event OracleResult(bytes32 indexed requestId, address indexed sponsor, bytes result, bool approved)',
  'event DisputeResolved(bytes32 indexed requestId, uint8 outcome, uint128 slashed, string reason)',
  'event DisputeTriggered(bytes32 indexed requestId, uint64 deadline)',
  'event DisputeOutOfScope(bytes32 indexed requestId, string context)',
  'event ArbitrationTimedOut(bytes32 indexed requestId)',
  'event RequestTimedOut(bytes32 indexed requestId)',
] as const

/** Read (view) functions the reader calls, from the protocol explorer's ABIs. */
export const CONSENSUS_READ_ABI = ['function getEpochGroupId(uint64 epoch) view returns (bytes32 groupId)'] as const

export const COORDINATOR_READ_ABI = [
  'function groupKey(bytes32 gid) view returns ((uint256 x, uint256 y) key)',
] as const

export const consensusInterface = new Interface(CONSENSUS_EVENT_FRAGMENTS)
export const sentinelInterface = new Interface(SENTINEL_EVENT_FRAGMENTS)

export type TopicDispatch = {
  iface: Interface
  eventName: string
  type: CheckEventType
}

/** One descriptor per decodable event; the source of truth for {@link TOPICS}. */
export const EVENT_DISPATCH: readonly TopicDispatch[] = [
  {
    iface: consensusInterface,
    eventName: 'TransactionProposed',
    type: CheckEventType.ORACLE_PROPOSED,
  },
  {
    iface: consensusInterface,
    eventName: 'TransactionAttested',
    type: CheckEventType.ORACLE_ATTESTED,
  },
  {
    iface: sentinelInterface,
    eventName: 'NewRequest',
    type: CheckEventType.REQUEST_CREATED,
  },
  {
    iface: sentinelInterface,
    eventName: 'Committed',
    type: CheckEventType.SENTINEL_COMMITTED,
  },
  {
    iface: sentinelInterface,
    eventName: 'Revealed',
    type: CheckEventType.SENTINEL_REVEALED,
  },
  {
    iface: sentinelInterface,
    eventName: 'OracleResult',
    type: CheckEventType.ORACLE_RESULT,
  },
  {
    iface: sentinelInterface,
    eventName: 'DisputeResolved',
    type: CheckEventType.DISPUTE_RESOLVED,
  },
  {
    iface: sentinelInterface,
    eventName: 'DisputeTriggered',
    type: CheckEventType.DISPUTE_TRIGGERED,
  },
  {
    iface: sentinelInterface,
    eventName: 'DisputeOutOfScope',
    type: CheckEventType.DISPUTE_OUT_OF_SCOPE,
  },
  {
    iface: sentinelInterface,
    eventName: 'ArbitrationTimedOut',
    type: CheckEventType.ARBITRATION_TIMED_OUT,
  },
  {
    iface: sentinelInterface,
    eventName: 'RequestTimedOut',
    type: CheckEventType.REQUEST_TIMED_OUT,
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
  (dispatch) => dispatch.iface !== sentinelInterface,
).map(topicHashOf)

/** Sentinel/oracle event topic0s — indexed by `requestId` (topic1). */
export const SENTINEL_TOPIC0S: readonly string[] = EVENT_DISPATCH.filter(
  (dispatch) => dispatch.iface === sentinelInterface,
).map(topicHashOf)
