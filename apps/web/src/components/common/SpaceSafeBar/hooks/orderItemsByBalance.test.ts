import { orderItemsByBalance } from './orderItemsByBalance'
import type { SafeItemData } from '@/features/spaces'

const makeItem = (id: string, balance: string): SafeItemData => ({
  id,
  name: id,
  address: id,
  threshold: 1,
  owners: 1,
  chains: [],
  balance,
})

describe('orderItemsByBalance', () => {
  it('sorts by balance descending', () => {
    const items = [makeItem('a', '100'), makeItem('b', '500'), makeItem('c', '300')]
    expect(orderItemsByBalance(items, 'none').map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('keeps the current item first regardless of its balance', () => {
    const items = [makeItem('a', '100'), makeItem('cur', '0'), makeItem('b', '500')]
    expect(orderItemsByBalance(items, 'cur').map((i) => i.id)).toEqual(['cur', 'b', 'a'])
  })

  it('sorts zero and missing balances after positive ones', () => {
    const items = [makeItem('a', ''), makeItem('b', '500'), makeItem('c', '0')]
    expect(orderItemsByBalance(items, 'none').map((i) => i.id)).toEqual(['b', 'a', 'c'])
  })

  it('preserves input order for equal balances (stable)', () => {
    const items = [makeItem('a', '100'), makeItem('b', '100'), makeItem('c', '100')]
    expect(orderItemsByBalance(items, 'none').map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps input order when every balance is still loading ("0")', () => {
    const items = [makeItem('a', '0'), makeItem('b', '0'), makeItem('c', '0')]
    expect(orderItemsByBalance(items, 'none').map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('returns only the sorted rest when the current item is not present', () => {
    const items = [makeItem('a', '100'), makeItem('b', '500')]
    expect(orderItemsByBalance(items, 'missing').map((i) => i.id)).toEqual(['b', 'a'])
  })
})
