import { proposedEvent, sentinelRevealedEvent } from '@safe-global/utils/features/safenet-checks/builders'
import { SAFENET_RULES } from '../rejectionRules'
import { formatFlaggedCount, summariseRejection } from '../summariseRejection'

const SENTINELS = ['0x01', '0x02', '0x03', '0x04', '0x05'].map((s) => s.padEnd(42, '0'))

const vote = (index: number, reason: string | null, blockNumber = 100 + index) =>
  sentinelRevealedEvent({
    sentinel: SENTINELS[index],
    approved: reason === null,
    reason: reason ?? '',
    blockNumber,
    logIndex: 0,
  })

describe('summariseRejection', () => {
  it('returns an empty summary when no sentinel revealed', () => {
    expect(summariseRejection([])).toEqual({ rules: [], flagged: 0, revealed: 0, unrecognised: false })
    expect(summariseRejection([proposedEvent()])).toEqual({ rules: [], flagged: 0, revealed: 0, unrecognised: false })
  })

  it('counts approvals as revealed but never as flagged', () => {
    expect(summariseRejection([vote(0, null), vote(1, null)])).toEqual({
      rules: [],
      flagged: 0,
      revealed: 2,
      unrecognised: false,
    })
  })

  it('summarises a single rule cited by every rejecting sentinel (example #1)', () => {
    const summary = summariseRejection([vote(0, 'R-4.1'), vote(1, 'R-4.1')])

    expect(summary.rules).toEqual([{ id: 'R-4.1', citedBy: 2, ...SAFENET_RULES['R-4.1'] }])
    expect(summary).toMatchObject({ flagged: 2, revealed: 2, unrecognised: false })
  })

  it('lists several rules once each, most-cited first (example #4)', () => {
    const summary = summariseRejection([vote(0, 'R-4.4'), vote(1, 'R-4.5'), vote(2, 'R-4.5'), vote(3, 'R-4.5')])

    expect(summary.rules.map(({ id, citedBy }) => [id, citedBy])).toEqual([
      ['R-4.5', 3],
      ['R-4.4', 1],
    ])
  })

  it('breaks citation ties by rule order', () => {
    const summary = summariseRejection([vote(0, 'R-4.6'), vote(1, 'R-4.2')])

    expect(summary.rules.map(({ id }) => id)).toEqual(['R-4.2', 'R-4.6'])
  })

  it('counts N of M across a split vote (example #7)', () => {
    const summary = summariseRejection([vote(0, null), vote(1, 'R-4.1')])

    expect(summary).toMatchObject({ flagged: 1, revealed: 2 })
    expect(formatFlaggedCount(summary)).toBe('1 of 2 sentinels flagged this.')
  })

  it('maps known codes and flags the rest as unrecognised in a mixed set', () => {
    const summary = summariseRejection([vote(0, 'R-4.2'), vote(1, 'R-9.9'), vote(2, null)])

    expect(summary.rules.map(({ id }) => id)).toEqual(['R-4.2'])
    expect(summary).toMatchObject({ flagged: 2, revealed: 3, unrecognised: true })
  })

  it.each(['', 'looks bad', 'r-4.1', 'R-4.1, R-4.2', 'R-4.10'])('treats %j as unrecognised', (reason) => {
    const summary = summariseRejection([vote(0, reason)])

    expect(summary.rules).toEqual([])
    expect(summary).toMatchObject({ flagged: 1, revealed: 1, unrecognised: true })
  })

  it('tolerates surrounding whitespace around a code', () => {
    expect(summariseRejection([vote(0, ' R-4.3\n')]).rules.map(({ id }) => id)).toEqual(['R-4.3'])
  })

  it('counts a sentinel once, keeping its latest reveal', () => {
    const summary = summariseRejection([vote(0, 'R-4.1', 100), vote(0, 'R-4.2', 200)])

    expect(summary.rules.map(({ id }) => id)).toEqual(['R-4.2'])
    expect(summary).toMatchObject({ flagged: 1, revealed: 1 })
  })
})

describe('formatFlaggedCount', () => {
  it('returns null with no reveals', () => {
    expect(formatFlaggedCount({ rules: [], flagged: 0, revealed: 0, unrecognised: false })).toBeNull()
  })

  it('uses the singular for a single sentinel', () => {
    expect(formatFlaggedCount({ rules: [], flagged: 1, revealed: 1, unrecognised: false })).toBe(
      '1 of 1 sentinel flagged this.',
    )
  })
})
