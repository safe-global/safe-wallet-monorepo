import type { MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { getSafeListComparator } from '../comparators'

const makeSafe = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  chainId: '1',
  address: '0x0000000000000000000000000000000000000001',
  isReadOnly: true,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

type Item = SafeItem | MultiChainSafeItem

const sortNames = (items: Item[], comparator: (a: Item, b: Item) => number) =>
  [...items].sort(comparator).map((i) => i.name)

describe('getSafeListComparator', () => {
  it('sorts A→Z ascending and puts undefined names last', () => {
    const items = [makeSafe({ name: 'Charlie' }), makeSafe({ name: undefined }), makeSafe({ name: 'Alpha' })]
    expect(sortNames(items, getSafeListComparator('name', 'asc'))).toEqual(['Alpha', 'Charlie', undefined])
  })

  it('reverses for descending', () => {
    const items = [makeSafe({ name: 'Alpha' }), makeSafe({ name: 'Charlie' })]
    expect(sortNames(items, getSafeListComparator('name', 'desc'))).toEqual(['Charlie', 'Alpha'])
  })
})
