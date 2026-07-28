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
})
