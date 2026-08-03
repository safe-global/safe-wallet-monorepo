import { reorderByKey, weaveReorderedKeys } from './reorder'

type Item = { address: string }

const items: Item[] = [{ address: '0xA' }, { address: '0xB' }, { address: '0xC' }]
const getKey = (item: Item) => item.address

describe('reorderByKey', () => {
  it('moves an item down and returns the new key order', () => {
    expect(reorderByKey(items, 0, 2, getKey)).toEqual(['0xB', '0xC', '0xA'])
  })

  it('moves an item up and returns the new key order', () => {
    expect(reorderByKey(items, 2, 0, getKey)).toEqual(['0xC', '0xA', '0xB'])
  })

  it('is a no-op when source and destination match', () => {
    expect(reorderByKey(items, 1, 1, getKey)).toEqual(['0xA', '0xB', '0xC'])
  })

  it('does not mutate the input', () => {
    const input: Item[] = [{ address: '0xA' }, { address: '0xB' }]
    reorderByKey(input, 0, 1, getKey)
    expect(input.map(getKey)).toEqual(['0xA', '0xB'])
  })
})

describe('weaveReorderedKeys', () => {
  it('keeps fixed keys at their original slots and fills the rest in order', () => {
    // Stored order: A B C D E, with C and E fixed (clustered). Movables A B D reordered to D A B.
    const result = weaveReorderedKeys(['a', 'b', 'c', 'd', 'e'], ['d', 'a', 'b'], (key) => key === 'c' || key === 'e')
    expect(result).toEqual(['d', 'a', 'c', 'b', 'e'])
  })

  it('is the identity when nothing is fixed and the movable order is unchanged', () => {
    expect(weaveReorderedKeys(['a', 'b', 'c'], ['a', 'b', 'c'], () => false)).toEqual(['a', 'b', 'c'])
  })

  it('is the identity when everything is fixed', () => {
    expect(weaveReorderedKeys(['a', 'b'], [], () => true)).toEqual(['a', 'b'])
  })

  it('fills unmentioned movable keys in stored order when the queue runs short — never duplicates', () => {
    expect(weaveReorderedKeys(['a', 'b', 'c'], ['c'], (key) => key === 'a')).toEqual(['a', 'c', 'b'])
  })

  it('drops duplicate and unknown entries from a drifted reorder', () => {
    expect(weaveReorderedKeys(['a', 'b', 'c'], ['stale', 'c', 'c', 'b'], () => false)).toEqual(['c', 'b', 'a'])
  })

  it('drops entries that became fixed since the reorder was computed', () => {
    expect(weaveReorderedKeys(['a', 'b', 'c'], ['c', 'a', 'b'], (key) => key === 'c')).toEqual(['a', 'b', 'c'])
  })

  it('always emits a permutation of allKeys', () => {
    const result = weaveReorderedKeys(['a', 'b', 'c', 'd'], ['d', 'd', 'x', 'b'], (key) => key === 'a')
    expect([...result].sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})
