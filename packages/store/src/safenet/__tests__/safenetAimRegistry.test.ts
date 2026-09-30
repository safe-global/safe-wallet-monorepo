import { forgetAim, recordAim, resolveAim } from '../safenetAimRegistry'

const HASH = ('0x' + 'ab'.repeat(32)) as `0x${string}`
const SAFE = '0x0000000000000000000000000000000000000abc'
const IDENTITY = { safeTxHash: HASH, chainId: '100', safeAddress: SAFE }

/** A transaction's submission date, and a later surrogate a surface might offer. */
const PROPOSED_AT = 1_700_000_000_000
const LATER_OFFER = PROPOSED_AT + 3_600_000

beforeEach(() => {
  forgetAim(IDENTITY)
  forgetAim({ ...IDENTITY, chainId: '1' })
})

describe('safenet aim registry', () => {
  it('has no aim for a check nothing has offered one for', () => {
    expect(resolveAim(IDENTITY)).toBeNull()
  })

  it('keeps the earliest offer, whichever order the surfaces offer in', () => {
    // The read looks for events emitted at or after the submission, so an offer
    // later than it can only narrow the window past them.
    expect(recordAim(IDENTITY, LATER_OFFER)).toBe(LATER_OFFER)
    expect(recordAim(IDENTITY, PROPOSED_AT)).toBe(PROPOSED_AT)
    expect(resolveAim(IDENTITY)).toBe(PROPOSED_AT)

    forgetAim(IDENTITY)

    expect(recordAim(IDENTITY, PROPOSED_AT)).toBe(PROPOSED_AT)
    expect(recordAim(IDENTITY, LATER_OFFER)).toBe(PROPOSED_AT)
    expect(resolveAim(IDENTITY)).toBe(PROPOSED_AT)
  })

  it('is idempotent — repeating an offer never moves the aim', () => {
    recordAim(IDENTITY, PROPOSED_AT)

    expect(recordAim(IDENTITY, PROPOSED_AT)).toBe(PROPOSED_AT)
    expect(resolveAim(IDENTITY)).toBe(PROPOSED_AT)
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['zero', 0],
  ])('ignores a %s offer instead of aiming at it', (_label, timestampMs) => {
    expect(recordAim(IDENTITY, timestampMs)).toBeNull()
    expect(resolveAim(IDENTITY)).toBeNull()
  })

  it('keeps an established aim when a later offer is unusable', () => {
    recordAim(IDENTITY, PROPOSED_AT)

    expect(recordAim(IDENTITY, null)).toBe(PROPOSED_AT)
    expect(resolveAim(IDENTITY)).toBe(PROPOSED_AT)
  })

  it('keys the aim by the Safe as well as the hash', () => {
    // Safe <=1.2.0 leaves the chain id out of its domain, so one hash can name
    // a check on two chains. They are two checks with two submission times.
    recordAim(IDENTITY, PROPOSED_AT)

    expect(resolveAim({ ...IDENTITY, chainId: '1' })).toBeNull()
  })

  it('matches the Safe address case-insensitively', () => {
    recordAim(IDENTITY, PROPOSED_AT)

    expect(resolveAim({ ...IDENTITY, safeAddress: SAFE.toUpperCase().replace('0X', '0x') })).toBe(PROPOSED_AT)
  })

  it('forgets an aim so a later mount rebuilds it from its own offer', () => {
    recordAim(IDENTITY, PROPOSED_AT)
    forgetAim(IDENTITY)

    expect(resolveAim(IDENTITY)).toBeNull()
    expect(recordAim(IDENTITY, LATER_OFFER)).toBe(LATER_OFFER)
  })
})
