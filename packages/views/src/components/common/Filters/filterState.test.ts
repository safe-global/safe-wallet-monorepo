import {
  formatFilterValues,
  getAppliedFilters,
  toggleValue,
  type FilterDimension,
} from '@safe-global/views/components/common/Filters/filterState'

const dimensions: FilterDimension[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'execute', label: 'Execute' },
      { value: 'sign', label: 'Sign' },
      { value: 'waiting', label: 'Waiting' },
    ],
  },
  { id: 'safe', label: 'Safe', options: [{ value: 'grants', label: 'Grants' }] },
]

describe('toggleValue', () => {
  it('adds a missing value at the end', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes a present value', () => {
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('does not mutate the input', () => {
    const selection = ['a']
    toggleValue(selection, 'b')
    expect(selection).toEqual(['a'])
  })
})

describe('formatFilterValues', () => {
  it('joins up to two values', () => {
    expect(formatFilterValues(['Grants'])).toBe('Grants')
    expect(formatFilterValues(['Execute', 'Sign'])).toBe('Execute, Sign')
  })

  it('collapses the rest into a count', () => {
    expect(formatFilterValues(['Execute', 'Sign', 'Waiting'])).toBe('Execute, Sign +1')
    expect(formatFilterValues(['A', 'B', 'C', 'D', 'E'])).toBe('A, B +3')
  })

  it('returns an empty string for no values', () => {
    expect(formatFilterValues([])).toBe('')
  })
})

describe('getAppliedFilters', () => {
  it('returns nothing when no dimension is filtering', () => {
    expect(getAppliedFilters(dimensions, {})).toEqual([])
    expect(getAppliedFilters(dimensions, { status: [], safe: [] })).toEqual([])
  })

  it('lists option labels in option order, in dimension order', () => {
    expect(getAppliedFilters(dimensions, { safe: ['grants'], status: ['waiting', 'execute'] })).toEqual([
      { id: 'status', label: 'Status', values: ['Execute', 'Waiting'] },
      { id: 'safe', label: 'Safe', values: ['Grants'] },
    ])
  })

  it('ignores values that are not options and dimensions that are not passed', () => {
    expect(getAppliedFilters(dimensions, { status: ['unknown'], network: ['base'] })).toEqual([])
  })
})
