import {
  buildSnapshot,
  sentinelCommittedEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import type { Hex } from '@safe-global/utils/features/safenet-checks'
import { ruleLabel, sentinelVotes } from '../sentinelVotes'

const ACTIVE = `0x${'aa'.repeat(32)}` as Hex
const OLDER = `0x${'bb'.repeat(32)}` as Hex
const ALICE = '0xe2eED4938d2fd005CB8744011031041eb5349536'
const BOB = '0xBF508D62Aa45fA2Ac9173DD748E0005a6562E2dc'

describe('sentinelVotes', () => {
  it('lists each sentinel of the active request once, with its revealed vote and reason', () => {
    const snapshot = buildSnapshot({
      requestId: ACTIVE,
      events: [
        sentinelCommittedEvent({ requestId: ACTIVE, sentinel: ALICE }),
        sentinelCommittedEvent({ requestId: ACTIVE, sentinel: BOB }),
        sentinelRevealedEvent({ requestId: ACTIVE, sentinel: ALICE, approved: false, reason: 'R-4.5' }),
        sentinelRevealedEvent({ requestId: ACTIVE, sentinel: BOB, approved: true, reason: '' }),
      ],
    })

    expect(sentinelVotes(snapshot)).toEqual([
      { sentinel: ALICE, vote: 'denied', reason: 'R-4.5' },
      { sentinel: BOB, vote: 'approved', reason: undefined },
    ])
  })

  it('keeps a sentinel that committed but has not revealed', () => {
    const snapshot = buildSnapshot({
      requestId: ACTIVE,
      events: [sentinelCommittedEvent({ requestId: ACTIVE, sentinel: ALICE })],
    })

    expect(sentinelVotes(snapshot)).toEqual([{ sentinel: ALICE, vote: 'committed' }])
  })

  it('ignores votes on an older request for the same transaction', () => {
    const snapshot = buildSnapshot({
      requestId: ACTIVE,
      events: [
        sentinelRevealedEvent({ requestId: OLDER, sentinel: ALICE, approved: false, reason: 'R-4.3' }),
        sentinelCommittedEvent({ requestId: ACTIVE, sentinel: BOB }),
      ],
    })

    expect(sentinelVotes(snapshot)).toEqual([{ sentinel: BOB, vote: 'committed' }])
  })

  it('returns nothing without an active request', () => {
    expect(sentinelVotes(undefined)).toEqual([])
    expect(sentinelVotes(buildSnapshot({ requestId: null, events: [sentinelCommittedEvent()] }))).toEqual([])
  })
})

describe('ruleLabel', () => {
  it('names a known rule code and passes any other reason through', () => {
    expect(ruleLabel('R-4.5')).toBe('R-4.5 Excessive approval')
    expect(ruleLabel('custom reason')).toBe('custom reason')
  })
})
