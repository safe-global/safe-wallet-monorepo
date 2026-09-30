import { compareGroups, type AccountGroup, type SafeSortKeys } from '../useSafeAccountRows'

const group = (sort: Partial<SafeSortKeys>, address = '0x0'): AccountGroup =>
  ({
    parent: { address } as AccountGroup['parent'],
    children: [],
    sort: { name: '', threshold: null, owners: null, networks: '', workspaces: 0, ...sort },
  }) as AccountGroup

describe('compareGroups', () => {
  it('sorts by name ascending and descending', () => {
    const a = group({ name: 'alpha' })
    const b = group({ name: 'bravo' })

    expect(compareGroups(a, b, 'name', 'asc')).toBeLessThan(0)
    expect(compareGroups(a, b, 'name', 'desc')).toBeGreaterThan(0)
  })

  it('sends empty names to the end regardless of sort direction', () => {
    const named = group({ name: 'zulu' })
    const empty = group({ name: '' })

    expect(compareGroups(named, empty, 'name', 'asc')).toBeLessThan(0)
    // Even descending, the empty name stays last
    expect(compareGroups(named, empty, 'name', 'desc')).toBeLessThan(0)
  })

  it('keeps named accounts above unnamed ones in both directions', () => {
    const named = group({ name: 'zulu' }, '0xaaa')
    const unnamed = group({ name: '' }, '0x111')

    expect(compareGroups(named, unnamed, 'name', 'asc')).toBeLessThan(0)
    expect(compareGroups(named, unnamed, 'name', 'desc')).toBeLessThan(0)
  })

  it('sorts unnamed accounts by address, reversing with the sort direction', () => {
    const bbb = group({ name: '' }, '0xBBB')
    const aaa = group({ name: '' }, '0xaaa')

    // Ascending: 0xaaa before 0xbbb (case-insensitively)
    expect(compareGroups(aaa, bbb, 'name', 'asc')).toBeLessThan(0)
    // Descending toggles the order — an all-unnamed list actually reverses
    expect(compareGroups(aaa, bbb, 'name', 'desc')).toBeGreaterThan(0)
  })

  it('breaks equal-name ties by address', () => {
    const a = group({ name: 'safe' }, '0xaaa')
    const b = group({ name: 'safe' }, '0xbbb')

    expect(compareGroups(a, b, 'name', 'asc')).toBeLessThan(0)
    expect(compareGroups(a, b, 'name', 'desc')).toBeGreaterThan(0)
  })

  it('sorts numeric columns and pushes null values to the end', () => {
    const low = group({ threshold: 2 })
    const high = group({ threshold: 5 })
    const unknown = group({ threshold: null })

    expect(compareGroups(low, high, 'threshold', 'asc')).toBeLessThan(0)
    expect(compareGroups(high, low, 'threshold', 'asc')).toBeGreaterThan(0)
    expect(compareGroups(low, unknown, 'threshold', 'asc')).toBeLessThan(0)
    // null stays last even descending
    expect(compareGroups(low, unknown, 'threshold', 'desc')).toBeLessThan(0)
  })

  it('breaks threshold ties by owner count (2/3 before 2/15)', () => {
    const small = group({ threshold: 2, owners: 3 })
    const large = group({ threshold: 2, owners: 15 })

    expect(compareGroups(small, large, 'threshold', 'asc')).toBeLessThan(0)
    expect(compareGroups(small, large, 'threshold', 'desc')).toBeGreaterThan(0)
  })

  it('sorts the networks column by chain identity, not by chain count', () => {
    const eth = group({ networks: 'ethereum' })
    const pol = group({ networks: 'polygon' })
    const unknown = group({ networks: '' })

    expect(compareGroups(eth, pol, 'networks', 'asc')).toBeLessThan(0)
    expect(compareGroups(eth, pol, 'networks', 'desc')).toBeGreaterThan(0)
    // A safe on no known chain sinks to the bottom in both directions
    expect(compareGroups(eth, unknown, 'networks', 'asc')).toBeLessThan(0)
    expect(compareGroups(eth, unknown, 'networks', 'desc')).toBeLessThan(0)
  })

  it('sorts the workspaces column by count', () => {
    const few = group({ workspaces: 0 })
    const many = group({ workspaces: 3 })

    expect(compareGroups(few, many, 'workspaces', 'asc')).toBeLessThan(0)
    expect(compareGroups(few, many, 'workspaces', 'desc')).toBeGreaterThan(0)
  })

  it('treats equal values as equal', () => {
    expect(compareGroups(group({ threshold: 3 }), group({ threshold: 3 }), 'threshold', 'asc')).toBe(0)
  })
})
