import { orderGroupsBySimilarity } from '../index'
import type { AccountGroup } from '../useSafeAccountRows'

// Minimal AccountGroup — orderGroupsBySimilarity only reads `group.parent.address`.
const g = (address: string) => ({ parent: { address } }) as unknown as AccountGroup
const addrs = (groups: AccountGroup[]) => groups.map((group) => group.parent.address)

describe('orderGroupsBySimilarity', () => {
  it('returns the input untouched when there are no similarity groups', () => {
    const groups = [g('0xA'), g('0xB'), g('0xC')]
    expect(orderGroupsBySimilarity(groups, undefined)).toBe(groups)
    expect(orderGroupsBySimilarity(groups, new Map())).toBe(groups)
  })

  it('pulls interleaved cluster members contiguous, keeping non-clustered rows in place', () => {
    // Input order: A(g1), X, B(g1), Y, C(g1)
    const groups = [g('0xA'), g('0xX'), g('0xB'), g('0xY'), g('0xC')]
    const similarityGroups = new Map([
      ['0xa', 'g1'],
      ['0xb', 'g1'],
      ['0xc', 'g1'],
    ])
    // No anchor (all flagged) → lead = first-seen member (A); the cluster lands at A's slot.
    const flagged = new Set(['0xa', '0xb', '0xc'])
    expect(addrs(orderGroupsBySimilarity(groups, similarityGroups, flagged))).toEqual([
      '0xA',
      '0xB',
      '0xC',
      '0xX',
      '0xY',
    ])
  })

  it('leads a cluster with its anchor (the member NOT flagged) and positions the band at the anchor', () => {
    // Input: X, impostor1(g1), Y, anchor(g1) — anchor appears later but must lead + set the position.
    const groups = [g('0xX'), g('0xIMP1'), g('0xY'), g('0xANCHOR')]
    const similarityGroups = new Map([
      ['0ximp1', 'g1'],
      ['0xanchor', 'g1'],
    ])
    const flagged = new Set(['0ximp1']) // anchor is NOT flagged
    // Band placed at the anchor's slot (after X, IMP1, Y in sort order the anchor is 4th → its slot),
    // with the anchor first, then the impostor.
    expect(addrs(orderGroupsBySimilarity(groups, similarityGroups, flagged))).toEqual([
      '0xX',
      '0xY',
      '0xANCHOR',
      '0xIMP1',
    ])
  })

  it('handles two separate clusters, each pulled to its own lead', () => {
    const groups = [g('0xA1'), g('0xB1'), g('0xA2'), g('0xN'), g('0xB2')]
    const similarityGroups = new Map([
      ['0xa1', 'gA'],
      ['0xa2', 'gA'],
      ['0xb1', 'gB'],
      ['0xb2', 'gB'],
    ])
    const flagged = new Set(['0xa1', '0xa2', '0xb1', '0xb2'])
    // gA lead = A1 (first seen); gB lead = B1 (first seen). N stays where it is.
    expect(addrs(orderGroupsBySimilarity(groups, similarityGroups, flagged))).toEqual([
      '0xA1',
      '0xA2',
      '0xB1',
      '0xB2',
      '0xN',
    ])
  })
})
