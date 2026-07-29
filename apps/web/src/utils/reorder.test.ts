import { reorderByKey } from './reorder'

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
