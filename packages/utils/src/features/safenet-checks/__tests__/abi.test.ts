import {
  CONSENSUS_EVENT_FRAGMENTS,
  CONSENSUS_PLAIN_EVENT_FRAGMENTS,
  consensusInterface,
  consensusPlainInterface,
  EVENT_DISPATCH,
  SENTINEL_EVENT_FRAGMENTS,
  TOPICS,
  topicHashOf,
} from '../abi'

describe('safenet-checks abi', () => {
  it('assigns a unique topic0 to every dispatched event (no collisions)', () => {
    const topics = EVENT_DISPATCH.map(topicHashOf)
    const unique = new Set(topics)
    expect(unique.size).toBe(EVENT_DISPATCH.length)
    // Every dispatch descriptor is reachable in the topic0 map.
    expect(Object.keys(TOPICS)).toHaveLength(EVENT_DISPATCH.length)
  })

  it('covers every declared fragment across all three interfaces', () => {
    const totalFragments =
      CONSENSUS_EVENT_FRAGMENTS.length + CONSENSUS_PLAIN_EVENT_FRAGMENTS.length + SENTINEL_EVENT_FRAGMENTS.length
    expect(EVENT_DISPATCH).toHaveLength(totalFragments)
  })

  // Regression guard: the plain pair was read off the live Gnosis beta
  // Consensus on 2026-07-28 — what beta actually emits while the sentinels
  // are not live there. Reading the wrong family silently yields "no events".
  it('matches the topic0s observed on the deployed Gnosis beta Consensus', () => {
    expect(consensusPlainInterface.getEvent('TransactionProposed')!.topicHash).toBe(
      '0xe7427c304b80147290ec649ec1d8881f5fa455e85ba79ecb7dbfc58a56ea0906',
    )
    expect(consensusPlainInterface.getEvent('TransactionAttested')!.topicHash).toBe(
      '0x72272729e643703db011cc155474c30d652f1a68712d921cc263a881efd7bce6',
    )
  })

  // Same guard for the relaunched (2026-08) Sepolia Consensus: both topic0s
  // were read off live logs (proposal tx 0x94b9f9b3…30b1, attestation tx
  // 0x9ae86704…4ff4b).
  it('matches the topic0s observed on the relaunched Sepolia Consensus', () => {
    expect(consensusInterface.getEvent('TransactionProposed')!.topicHash).toBe(
      '0x47d867ce4d91d0487fa4d2ac80b13e7466ce53dd018a8eef564fc60c92b53d03',
    )
    expect(consensusInterface.getEvent('TransactionAttested')!.topicHash).toBe(
      '0x1980afd018b6bb99a313d3b7a88274259621396f9b8acaa712ef114872977357',
    )
  })

  // Freeze EVERY fragment's topic0 as a literal. This is the drift guard that
  // used to live in checked-in synthetic fixtures: an accidental edit to any
  // fragment (builders re-encode and would pass silently) fails here instead.
  // The consensus pairs and the sentinel NewRequest/Committed/Revealed/
  // OracleResult match live captures; DisputeResolved has no emitter yet, so
  // its literal is the only pin it has.
  it('freezes every fragment topic0 (fragment edits must be deliberate)', () => {
    const byName = Object.fromEntries(
      EVENT_DISPATCH.map((dispatch) => [`${dispatch.type}:${dispatch.eventName}`, topicHashOf(dispatch)]),
    )
    expect(byName).toEqual({
      'ORACLE_PROPOSED:TransactionProposed': '0x47d867ce4d91d0487fa4d2ac80b13e7466ce53dd018a8eef564fc60c92b53d03',
      'ORACLE_ATTESTED:TransactionAttested': '0x1980afd018b6bb99a313d3b7a88274259621396f9b8acaa712ef114872977357',
      'PLAIN_PROPOSED:TransactionProposed': '0xe7427c304b80147290ec649ec1d8881f5fa455e85ba79ecb7dbfc58a56ea0906',
      'PLAIN_ATTESTED:TransactionAttested': '0x72272729e643703db011cc155474c30d652f1a68712d921cc263a881efd7bce6',
      'REQUEST_CREATED:NewRequest': '0x1b858ca4149378382c073a8f8f0304d947775d07f6b7b7a4fb41f314bbf59f58',
      'SENTINEL_COMMITTED:Committed': '0x45acbf2626c7d2bd97eb2142a43d392e8f3364c9e140b3d022446155491819d6',
      'SENTINEL_REVEALED:Revealed': '0xd2cdead965dbd376703d9a79240f31f1228055ab42384b68353332fcd2af939a',
      'ORACLE_RESULT:OracleResult': '0x7843c453c4f7442b00e1bf3873e741f18f3447e18a13304c58bef95efd311757',
      'DISPUTE_RESOLVED:DisputeResolved': '0x7e739d167696b2e67be44f7ceb3afa7ad9e8ad5ee53d016de97ae7ab0b416a70',
    })
  })
})
