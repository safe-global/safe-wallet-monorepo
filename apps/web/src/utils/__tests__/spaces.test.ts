import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import {
  addressOfSafeKey,
  countSeats,
  hasSpacePlan,
  isSpaceAtSafeLimit,
  pickSafeWorkspace,
  type SafeWorkspacePick,
} from '../spaces'

describe('isSpaceAtSafeLimit', () => {
  it('is at the limit once the count reaches the quota', () => {
    expect(isSpaceAtSafeLimit(20, 20)).toBe(true)
    expect(isSpaceAtSafeLimit(21, 20)).toBe(true)
  })

  it('is below the limit while the count is under the quota', () => {
    expect(isSpaceAtSafeLimit(19, 20)).toBe(false)
  })

  it('is never at the limit on an unlimited plan or with an unknown count', () => {
    expect(isSpaceAtSafeLimit(400, null)).toBe(false)
    expect(isSpaceAtSafeLimit(undefined, 20)).toBe(false)
  })

  it('is never at the limit while the limit itself is unknown', () => {
    expect(isSpaceAtSafeLimit(400, undefined)).toBe(false)
  })
})

describe('countSeats', () => {
  it('counts one seat per address, however many chains and whatever the casing', () => {
    expect(countSeats(['0xAbC', '0xabc', '0xDEF'])).toBe(2)
    expect(countSeats([])).toBe(0)
  })

  it('reads the address out of a chainId:address key', () => {
    expect(addressOfSafeKey('100:0xAbC')).toBe('0xAbC')
    expect(countSeats(['1:0xA', '10:0xA', '1:0xB'].map(addressOfSafeKey))).toBe(2)
  })
})

describe('hasSpacePlan', () => {
  const entitlements = (plan: EntitlementsResponse['plan']): EntitlementsResponse => ({ plan, entitlements: [] })

  it('counts every Workspace as having a plan while Safe Pro is off', () => {
    expect(hasSpacePlan(false, undefined)).toBe(true)
  })

  it('reads the plan of the Workspace under Safe Pro', () => {
    expect(
      hasSpacePlan(true, entitlements({ id: 'starter', name: 'Starter', cycleEndsAt: null, status: 'active' })),
    ).toBe(true)
    expect(hasSpacePlan(true, entitlements(null))).toBe(false)
  })

  it('leaves the plan unknown while the entitlements are unknown', () => {
    expect(hasSpacePlan(true, undefined)).toBeUndefined()
  })
})

const A = 'space-a'
const B = 'space-b'
const C = 'space-c'

const plans =
  (withPlan: Record<string, boolean | undefined>) =>
  (spaceId: string): boolean | undefined =>
    withPlan[spaceId]

describe('pickSafeWorkspace', () => {
  it.each<[string, string[], Record<string, boolean | undefined>, SafeWorkspacePick]>([
    ['a Safe in no Workspace', [], {}, { kind: 'none' }],
    ['a Safe in one Workspace, even without a plan', [A], { [A]: false }, { kind: 'one', spaceId: A }],
    ['a Safe whose only Workspace with a plan is B', [A, B], { [A]: false, [B]: true }, { kind: 'one', spaceId: B }],
    [
      'a Safe in Workspaces that all have a plan',
      [A, B],
      { [A]: true, [B]: true },
      { kind: 'choose', spaceIds: [A, B] },
    ],
    ['a Safe in Workspaces without a plan', [A, B], { [A]: false, [B]: false }, { kind: 'choose', spaceIds: [A, B] }],
    [
      'a Safe in Workspaces whose plans are unknown',
      [A, B],
      { [A]: undefined, [B]: undefined },
      { kind: 'choose', spaceIds: [A, B] },
    ],
    [
      'a Safe in two Workspaces with a plan and one without',
      [A, B, C],
      { [A]: true, [B]: true, [C]: false },
      { kind: 'choose', spaceIds: [A, B, C] },
    ],
  ])('picks for %s', (_, spaceIds, withPlan, expected) => {
    expect(pickSafeWorkspace(spaceIds, plans(withPlan))).toEqual(expected)
  })
})
