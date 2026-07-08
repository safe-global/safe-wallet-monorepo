import { getComparator, manualComparator, nameComparator, lastVisitedComparator } from './comparators'
import { OrderByOption } from '@/store/orderByPreferenceSlice'
import type { SafeItem } from './useAllSafes'

const safe = (over: Partial<SafeItem> & Pick<SafeItem, 'address'>): SafeItem => ({
  chainId: '1',
  isReadOnly: false,
  isPinned: true,
  lastVisited: 0,
  name: undefined,
  ...over,
})

const order = <T extends { address: string }>(items: T[], cmp: (a: T, b: T) => number) =>
  [...items].sort(cmp).map((s) => s.address)

describe('comparators', () => {
  describe('nameComparator', () => {
    it('sorts by name A→Z and pushes unnamed safes last', () => {
      const items = [
        safe({ address: '0x3' }),
        safe({ address: '0x1', name: 'Bravo' }),
        safe({ address: '0x2', name: 'Alpha' }),
      ]
      expect(order(items, nameComparator)).toEqual(['0x2', '0x1', '0x3'])
    })
  })

  describe('lastVisitedComparator', () => {
    it('sorts most-recently visited first', () => {
      const items = [safe({ address: '0x1', lastVisited: 10 }), safe({ address: '0x2', lastVisited: 30 })]
      expect(order(items, lastVisitedComparator)).toEqual(['0x2', '0x1'])
    })
  })

  describe('manualComparator', () => {
    it('orders by the explicit address sequence, case-insensitively', () => {
      const items = [safe({ address: '0xAAA' }), safe({ address: '0xBBB' }), safe({ address: '0xCCC' })]
      expect(order(items, manualComparator(['0xccc', '0xaaa', '0xbbb']))).toEqual(['0xCCC', '0xAAA', '0xBBB'])
    })

    it('sinks addresses missing from the sequence to the bottom, ordered A→Z', () => {
      const items = [
        safe({ address: '0x1', name: 'Zed' }),
        safe({ address: '0x2', name: 'Ace' }),
        safe({ address: '0x3', name: 'Known' }),
      ]
      // Only 0x3 is in the manual order; 0x1/0x2 fall to the bottom sorted by name (Ace before Zed).
      expect(order(items, manualComparator(['0x3']))).toEqual(['0x3', '0x2', '0x1'])
    })
  })

  describe('getComparator', () => {
    const items = [
      safe({ address: '0x1', name: 'Bravo', lastVisited: 5 }),
      safe({ address: '0x2', name: 'Alpha', lastVisited: 9 }),
    ]

    it('returns the name comparator for NAME', () => {
      expect(order(items, getComparator(OrderByOption.NAME))).toEqual(['0x2', '0x1'])
    })

    it('returns the last-visited comparator for LAST_VISITED', () => {
      expect(order(items, getComparator(OrderByOption.LAST_VISITED))).toEqual(['0x2', '0x1'])
    })

    it('applies the manual order for MANUAL when one is provided', () => {
      expect(order(items, getComparator(OrderByOption.MANUAL, ['0x1', '0x2']))).toEqual(['0x1', '0x2'])
    })

    it('falls back to A→Z for MANUAL when no order is provided', () => {
      expect(order(items, getComparator(OrderByOption.MANUAL))).toEqual(['0x2', '0x1'])
      expect(order(items, getComparator(OrderByOption.MANUAL, []))).toEqual(['0x2', '0x1'])
    })
  })
})
