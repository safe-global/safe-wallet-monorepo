import { reorderByKey, weaveReorderedKeys } from '../reorder'

describe('reorderByKey', () => {
  const items = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }]

  it('moves an item forward and returns keys in the new order', () => {
    expect(reorderByKey(items, 0, 2, (item) => item.key)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item backward', () => {
    expect(reorderByKey(items, 3, 1, (item) => item.key)).toEqual(['a', 'd', 'b', 'c'])
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

  it('keeps the original key when the movable queue runs short', () => {
    expect(weaveReorderedKeys(['a', 'b', 'c'], ['c'], (key) => key === 'a')).toEqual(['a', 'c', 'c'])
  })
})
