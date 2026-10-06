import { BLOCK_TIME_SECONDS } from '@safe-global/utils/features/safenet-checks/constants'
import { formatSimulatingLabel, formatTimingSentence, getCheckTiming } from '../checkTiming'

const NOW = 1_770_000_000_000
const HEAD = '40000000'
const ahead = (seconds: number) => String(Number(HEAD) + seconds / BLOCK_TIME_SECONDS)

describe('getCheckTiming', () => {
  it('converts the blocks left until the deadline into minutes, rounded up', () => {
    expect(getCheckTiming({ deadlineBlock: ahead(95), headBlock: HEAD, startedAtMs: null, nowMs: NOW })).toEqual({
      kind: 'remaining',
      minutes: 2,
    })
    expect(getCheckTiming({ deadlineBlock: ahead(120), headBlock: HEAD, startedAtMs: null, nowMs: NOW })).toEqual({
      kind: 'remaining',
      minutes: 2,
    })
  })

  it('reports at least one minute while any block is left', () => {
    expect(getCheckTiming({ deadlineBlock: ahead(5), headBlock: HEAD, startedAtMs: null, nowMs: NOW })).toEqual({
      kind: 'remaining',
      minutes: 1,
    })
  })

  it.each([
    ['deadline', { deadlineBlock: null, headBlock: HEAD }],
    ['head', { deadlineBlock: ahead(60), headBlock: null }],
  ])('falls back to elapsed time when the %s block is unknown', (_name, blocks) => {
    expect(getCheckTiming({ ...blocks, startedAtMs: NOW - 3 * 60_000 - 5_000, nowMs: NOW })).toEqual({
      kind: 'elapsed',
      minutes: 3,
    })
  })

  it('falls back to elapsed time once the deadline has passed', () => {
    expect(
      getCheckTiming({ deadlineBlock: HEAD, headBlock: ahead(30), startedAtMs: NOW - 60_000, nowMs: NOW }),
    ).toEqual({ kind: 'elapsed', minutes: 1 })
  })

  it('returns null with neither blocks nor a start time', () => {
    expect(getCheckTiming({ deadlineBlock: null, headBlock: null, startedAtMs: null, nowMs: NOW })).toBeNull()
  })

  it('returns null for a start time in the future (clock skew)', () => {
    expect(getCheckTiming({ deadlineBlock: null, headBlock: null, startedAtMs: NOW + 1_000, nowMs: NOW })).toBeNull()
  })
})

describe('formatTimingSentence', () => {
  it.each([
    [null, null],
    [{ kind: 'remaining', minutes: 1 }, 'Less than a minute left.'],
    [{ kind: 'remaining', minutes: 2 }, 'Up to about 2 min left.'],
    [{ kind: 'elapsed', minutes: 0 }, 'Started just now.'],
    [{ kind: 'elapsed', minutes: 4 }, 'Started 4 min ago.'],
  ] as const)('formats %j as %j', (timing, expected) => {
    expect(formatTimingSentence(timing)).toBe(expected)
  })
})

describe('formatSimulatingLabel', () => {
  it.each([
    [null, 'Simulating'],
    [{ kind: 'remaining', minutes: 1 }, 'Simulating · under 1 min'],
    [{ kind: 'remaining', minutes: 2 }, 'Simulating · up to ~2 min'],
    [{ kind: 'elapsed', minutes: 0 }, 'Simulating'],
    [{ kind: 'elapsed', minutes: 3 }, 'Simulating for 3 min'],
  ] as const)('formats %j as %j', (timing, expected) => {
    expect(formatSimulatingLabel(timing)).toBe(expected)
  })
})
