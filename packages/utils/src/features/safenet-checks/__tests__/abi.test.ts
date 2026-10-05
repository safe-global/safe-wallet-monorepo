import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Interface, keccak256, toUtf8Bytes } from 'ethers'
import {
  CONSENSUS_READ_ABI,
  CONSENSUS_TOPIC0S,
  COORDINATOR_READ_ABI,
  EVENT_DISPATCH,
  SENTINEL_TOPIC0S,
  TOPICS,
  consensusInterface,
  oracleReadInterface,
  sentinelInterface,
  topicHashOf,
} from '../abi'

type Capture = {
  label: string
  kind: 'attested' | 'disputed'
  requestId: string
  logs: Array<{ address: string; topics: string[]; data: string }>
  requestState: { rawResult: string }
  expected: {
    state: string
    committedCount: number
    revealedCount: number
    approveCount: number
    denyCount: number
  }
}

type RequestTuple = {
  terms: {
    commitDeadline: bigint
    daoFeeShare: bigint
    revealDeadline: bigint
    bondTarget: bigint
    _padding: bigint
    sponsor: string
    slashAmount: bigint
  }
  progress: {
    state: bigint
    fee: bigint
    arbitrationDeadline: bigint
    committedCount: bigint
    revealedCount: bigint
    approveSentinelCount: bigint
    denySentinelCount: bigint
    _padding: bigint
  }
}

const fixture: { captures: Capture[] } = JSON.parse(
  readFileSync(join(__dirname, '../__fixtures__/gnosis-aegis.json'), 'utf8'),
)

const declaredTopics = (iface: Interface): string[] => {
  const topics: string[] = []
  iface.forEachEvent((event) => topics.push(event.topicHash))
  return topics
}

const dispatchedTopic = (eventName: string): string => {
  const dispatch = EVENT_DISPATCH.find((entry) => entry.eventName === eventName)
  if (!dispatch) throw new Error(`no dispatch for ${eventName}`)
  return topicHashOf(dispatch)
}

// Emitted by the deployed Oracle but absent from our fragments (sentinel payout); the decoder must ignore it.
const CLAIMED_TOPIC0 = keccak256(toUtf8Bytes('Claimed(bytes32,address,uint96,uint96)'))

const lifecycleOf = ({ kind, expected }: Capture): string[] => {
  const opening = [
    'TransactionProposed',
    'NewRequest',
    ...Array<string>(expected.committedCount).fill('Committed'),
    ...Array<string>(expected.revealedCount).fill('Revealed'),
  ]
  return kind === 'attested'
    ? [...opening, 'OracleResult', ...Array<string>(expected.revealedCount).fill('Claimed'), 'TransactionAttested']
    : [...opening, 'DisputeTriggered']
}

const topicOfLifecycleStep = (step: string): string => (step === 'Claimed' ? CLAIMED_TOPIC0 : dispatchedTopic(step))

const STATE_ORDINAL: Record<string, number> = {
  PENDING: 1,
  FROZEN: 2,
  RESOLVED_APPROVED: 3,
  RESOLVED_DENIED: 4,
  TIMED_OUT: 5,
}

describe('safenet-checks abi — event dispatch', () => {
  it('assigns a unique topic0 to every dispatched event (no collisions)', () => {
    const topics = EVENT_DISPATCH.map(topicHashOf)
    expect(new Set(topics).size).toBe(EVENT_DISPATCH.length)
    expect(Object.keys(TOPICS).sort()).toEqual([...topics].sort())
  })

  it('dispatches every event declared by the Consensus and sentinel interfaces, and nothing else', () => {
    const declared = [...declaredTopics(consensusInterface), ...declaredTopics(sentinelInterface)]
    expect(Object.keys(TOPICS).sort()).toEqual(declared.sort())
  })

  it('splits the topic0 lists by emitting contract', () => {
    expect([...CONSENSUS_TOPIC0S].sort()).toEqual(declaredTopics(consensusInterface).sort())
    expect([...SENTINEL_TOPIC0S].sort()).toEqual(declaredTopics(sentinelInterface).sort())
  })

  it('does not dispatch the undeclared on-chain Claimed event', () => {
    expect(TOPICS[CLAIMED_TOPIC0]).toBeUndefined()
  })

  it('keeps DisputeResolved on the topic0 of its signature, whatever the last argument is called', () => {
    const signatureTopic = keccak256(toUtf8Bytes('DisputeResolved(bytes32,uint8,uint128,string)'))
    expect(dispatchedTopic('DisputeResolved')).toBe(signatureTopic)
  })
})

describe.each(fixture.captures)('safenet-checks abi — on-chain lifecycle of $label', (capture) => {
  it('emits the topic0s computed from the fragments, in lifecycle order', () => {
    const observed = capture.logs.map((log) => log.topics[0])
    expect(observed).toEqual(lifecycleOf(capture).map(topicOfLifecycleStep))
  })
})

// Frozen: an accidental fragment edit must fail here (builders re-encode through the same fragments and would pass).
describe('safenet-checks abi — frozen topic0s', () => {
  it('pins every fragment topic0 (fragment edits must be deliberate)', () => {
    const byName = Object.fromEntries(
      EVENT_DISPATCH.map((dispatch) => [`${dispatch.type}:${dispatch.eventName}`, topicHashOf(dispatch)]),
    )
    expect(byName).toEqual({
      'ORACLE_PROPOSED:TransactionProposed': '0x47d867ce4d91d0487fa4d2ac80b13e7466ce53dd018a8eef564fc60c92b53d03',
      'ORACLE_ATTESTED:TransactionAttested': '0x1980afd018b6bb99a313d3b7a88274259621396f9b8acaa712ef114872977357',
      'REQUEST_CREATED:NewRequest': '0x1b858ca4149378382c073a8f8f0304d947775d07f6b7b7a4fb41f314bbf59f58',
      'SENTINEL_COMMITTED:Committed': '0x45acbf2626c7d2bd97eb2142a43d392e8f3364c9e140b3d022446155491819d6',
      'SENTINEL_REVEALED:Revealed': '0xd2cdead965dbd376703d9a79240f31f1228055ab42384b68353332fcd2af939a',
      'ORACLE_RESULT:OracleResult': '0x7843c453c4f7442b00e1bf3873e741f18f3447e18a13304c58bef95efd311757',
      'DISPUTE_TRIGGERED:DisputeTriggered': '0x86e8b85731e4787f033d85108356db1e068dea243be32d422e6dc5681ff49cc1',
      'DISPUTE_RESOLVED:DisputeResolved': '0x7e739d167696b2e67be44f7ceb3afa7ad9e8ad5ee53d016de97ae7ab0b416a70',
      'DISPUTE_OUT_OF_SCOPE:DisputeOutOfScope': '0xe32b95dcf423c9ed3915554e30a0db65ad08358b5e5bdb1138c98dcb745dbe81',
      'ARBITRATION_TIMED_OUT:ArbitrationTimedOut': '0x5f19817b3ad988fdb5a7fb3f657a755e58a107bf47431574b7c516a6dc1551e6',
      'REQUEST_TIMED_OUT:RequestTimedOut': '0xf1ca1e9147be737b04a2b018a79405f687a97de8dd8a2559bbe62357343af414',
    })
  })
})

describe('safenet-checks abi — read selectors', () => {
  const consensusReadInterface = new Interface([...CONSENSUS_READ_ABI])
  const coordinatorReadInterface = new Interface([...COORDINATOR_READ_ABI])

  it.each([
    { iface: oracleReadInterface, signature: 'PROPOSER()', selector: '0xbffa7f0f' },
    { iface: oracleReadInterface, signature: 'getRequest(bytes32)', selector: '0xfb1e61ca' },
    { iface: consensusReadInterface, signature: 'getCoordinator()', selector: '0x71977fe0' },
    { iface: consensusReadInterface, signature: 'getEpochGroupId(uint64)', selector: '0xe753bd85' },
    { iface: consensusReadInterface, signature: 'getAttestationSignatureId(bytes32)', selector: '0x522d53c6' },
    {
      iface: consensusReadInterface,
      signature: 'getTransactionAttestationByHash(uint64,address,bytes32,bytes32)',
      selector: '0xacccfa80',
    },
    { iface: coordinatorReadInterface, signature: 'groupKey(bytes32)', selector: '0x27a7dae0' },
  ])('exposes $signature at its canonical selector', ({ iface, signature, selector }) => {
    expect(iface.getFunction(signature)?.selector).toBe(selector)
    expect(keccak256(toUtf8Bytes(signature)).slice(0, 10)).toBe(selector)
  })

  it('recognises the RequestNotFound() revert by its selector', () => {
    expect(oracleReadInterface.parseError('0x4b13b31e')?.name).toBe('RequestNotFound')
  })
})

describe.each(fixture.captures)('safenet-checks abi — getRequest result of $label', (capture) => {
  const request = oracleReadInterface.decodeFunctionResult(
    'getRequest',
    capture.requestState.rawResult,
  )[0] as RequestTuple
  const newRequestLog = capture.logs.find((log) => log.topics[0] === dispatchedTopic('NewRequest'))!
  const opened = sentinelInterface.parseLog(newRequestLog)!.args

  it('decodes the real on-chain bytes into the expected state and sentinel counts', () => {
    expect({
      state: Number(request.progress.state),
      committed: Number(request.progress.committedCount),
      revealed: Number(request.progress.revealedCount),
      approve: Number(request.progress.approveSentinelCount),
      deny: Number(request.progress.denySentinelCount),
    }).toEqual({
      state: STATE_ORDINAL[capture.expected.state],
      committed: capture.expected.committedCount,
      revealed: capture.expected.revealedCount,
      approve: capture.expected.approveCount,
      deny: capture.expected.denyCount,
    })
  })

  it('reads the padding members as zero and every member around them at the right offset', () => {
    expect(request.terms._padding).toBe(0n)
    expect(request.progress._padding).toBe(0n)
    expect(request.terms.bondTarget).toBe(opened.bondTarget)
    expect(request.terms.sponsor).toBe(opened.sponsor)
    expect(request.terms.slashAmount).toBe(opened.slashAmount)
    expect(request.terms.revealDeadline).toBe(opened.revealDeadline)
  })
})
