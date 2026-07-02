import { compareGroups, type AccountGroup, type SafeSortKeys } from '../useSafeAccountRows'

const group = (sort: Partial<SafeSortKeys>): AccountGroup =>
  ({
    parent: {} as AccountGroup['parent'],
    children: [],
    sort: { name: '', threshold: null, networks: 0, workspaces: 0, ...sort },
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

  it('sorts by networks and workspaces counts', () => {
    const few = group({ networks: 1, workspaces: 0 })
    const many = group({ networks: 4, workspaces: 3 })

    expect(compareGroups(few, many, 'networks', 'asc')).toBeLessThan(0)
    expect(compareGroups(few, many, 'workspaces', 'desc')).toBeGreaterThan(0)
  })

  it('treats equal values as equal', () => {
    expect(compareGroups(group({ threshold: 3 }), group({ threshold: 3 }), 'threshold', 'asc')).toBe(0)
  })
})
