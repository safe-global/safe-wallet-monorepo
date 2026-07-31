import {
  CONSENSUS_EVENT_FRAGMENTS,
  CONSENSUS_PLAIN_EVENT_FRAGMENTS,
  consensusPlainInterface,
  EVENT_DISPATCH,
  SHARED_ORACLE_EVENT_FRAGMENTS,
  TOPICS,
  V1_SENTINEL_EVENT_FRAGMENTS,
  V2_SENTINEL_EVENT_FRAGMENTS,
  topicHashOf,
  v1SentinelInterface,
  v2SentinelInterface,
} from '../abi'

describe('safenet-checks abi', () => {
  it('assigns a unique topic0 to every dispatched event (no collisions)', () => {
    const topics = EVENT_DISPATCH.map(topicHashOf)
    const unique = new Set(topics)
    expect(unique.size).toBe(EVENT_DISPATCH.length)
    // Every dispatch descriptor is reachable in the topic0 map.
    expect(Object.keys(TOPICS)).toHaveLength(EVENT_DISPATCH.length)
  })

  it('gives V1 and V2 NewRequest distinct topic0s (the disambiguation invariant)', () => {
    const v1 = v1SentinelInterface.getEvent('NewRequest')!.topicHash
    const v2 = v2SentinelInterface.getEvent('NewRequest')!.topicHash
    expect(v1).not.toBe(v2)
  })

  it('gives V1 and V2 Committed distinct topic0s', () => {
    const v1 = v1SentinelInterface.getEvent('Committed')!.topicHash
    const v2 = v2SentinelInterface.getEvent('Committed')!.topicHash
    expect(v1).not.toBe(v2)
  })

  it('covers every declared fragment across all five interfaces', () => {
    const totalFragments =
      CONSENSUS_EVENT_FRAGMENTS.length +
      CONSENSUS_PLAIN_EVENT_FRAGMENTS.length +
      V1_SENTINEL_EVENT_FRAGMENTS.length +
      V2_SENTINEL_EVENT_FRAGMENTS.length +
      SHARED_ORACLE_EVENT_FRAGMENTS.length
    expect(EVENT_DISPATCH).toHaveLength(totalFragments)
  })

  // Regression guard: these four topic0s were read off the live Gnosis beta
  // Consensus on 2026-07-28. The oracle pair is what repo HEAD emits; the plain
  // pair is what beta actually emits while the sentinels are not yet live.
  // Reading the wrong family silently yields "no events found".
  it('matches the topic0s observed on the deployed Gnosis beta Consensus', () => {
    expect(consensusPlainInterface.getEvent('TransactionProposed')!.topicHash).toBe(
      '0xe7427c304b80147290ec649ec1d8881f5fa455e85ba79ecb7dbfc58a56ea0906',
    )
    expect(consensusPlainInterface.getEvent('TransactionAttested')!.topicHash).toBe(
      '0x72272729e643703db011cc155474c30d652f1a68712d921cc263a881efd7bce6',
    )
  })

  // Freeze EVERY fragment's topic0 as a literal. This is the drift guard that
  // used to live in checked-in synthetic fixtures: an accidental edit to any
  // fragment (builders re-encode and would pass silently) fails here instead.
  // The oracle pair matches the devnet capture; V1/V2/shared have no deployed
  // emitter yet, so these literals are the only pin they have.
  it('freezes every fragment topic0 (fragment edits must be deliberate)', () => {
    const byName = Object.fromEntries(
      EVENT_DISPATCH.map((dispatch) => [`${dispatch.generation}:${dispatch.eventName}`, topicHashOf(dispatch)]),
    )
    expect(byName).toEqual({
      'STABLE:OracleTransactionProposed': '0x2ceb0a519216f37afea39ab3df79b3af66fe1418bdd96d0b0abd59faf6eeb9bd',
      'STABLE:OracleTransactionAttested': '0x6ff9d0192d4044970a508dfd2675c86e28b9e686ad77b2d36b8f753aee617458',
      'STABLE:TransactionProposed': '0xe7427c304b80147290ec649ec1d8881f5fa455e85ba79ecb7dbfc58a56ea0906',
      'STABLE:TransactionAttested': '0x72272729e643703db011cc155474c30d652f1a68712d921cc263a881efd7bce6',
      'V1:NewRequest': '0x0701ea6c1ad014702d8fdda9cd3f4129aa50918e33489ba54635c84f3d7ba54d',
      'V1:Committed': '0xeca829820eb1ed95afbeae55c0a0b4027affc17a2fd075261fb7b16c3dd100a9',
      'V2:NewRequest': '0xd6016a1c9edccb99da0fecc1d12a0e2147bf89731a70db1693f836a75adc5423',
      'V2:Committed': '0x014da346f1eee9a9a0e466b5406c84ea9a5b4d35bfeb399eebea697a6f66d05b',
      'V2:Revealed': '0x62264f96fbb16bd32cc91d7f85e3c9d8380ce8335192d973982babf2c0e98ef6',
      'STABLE:OracleResult': '0x7843c453c4f7442b00e1bf3873e741f18f3447e18a13304c58bef95efd311757',
      'STABLE:DisputeResolved': '0xebb8cc3e5934aa32ce3d93b5c6e569de023f79e0d6e41b64bc06f8aa58dd181e',
    })
  })
})
