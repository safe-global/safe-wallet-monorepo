import { faker } from '@faker-js/faker'
import {
  buildSnapshot,
  sentinelCommittedEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import type { Hex } from '@safe-global/utils/features/safenet-checks'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ruleLabel, sentinelVotes } from '../sentinelVotes'

const hash = () => faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex
const ACTIVE = hash()
const OLDER = hash()
const ALICE = checksumAddress(faker.finance.ethereumAddress())
const BOB = checksumAddress(faker.finance.ethereumAddress())

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
