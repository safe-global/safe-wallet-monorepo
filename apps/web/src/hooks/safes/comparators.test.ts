import { OrderByOption } from '@/store/orderByPreferenceSlice'
import { nameComparator, lastVisitedComparator, getComparator } from './comparators'
import type { SafeItem } from './useAllSafes'

const makeSafe = (overrides: Partial<SafeItem>): SafeItem => ({
  chainId: '1',
  address: '0x1',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
  ...overrides,
})

describe('comparators', () => {
  describe('nameComparator', () => {
    it('sorts names A→Z', () => {
      const result = [makeSafe({ name: 'Beta' }), makeSafe({ name: 'Alpha' })].sort(nameComparator)
      expect(result.map((s) => s.name)).toEqual(['Alpha', 'Beta'])
    })

    it('puts unnamed safes last', () => {
      const result = [makeSafe({ name: undefined }), makeSafe({ name: 'Alpha' })].sort(nameComparator)
      expect(result.map((s) => s.name)).toEqual(['Alpha', undefined])
    })
  })

  describe('lastVisitedComparator', () => {
    it('sorts most-recent first', () => {
      const result = [makeSafe({ lastVisited: 1 }), makeSafe({ lastVisited: 5 })].sort(lastVisitedComparator)
      expect(result.map((s) => s.lastVisited)).toEqual([5, 1])
    })
  })

  describe('getComparator', () => {
    it('returns the name comparator for NAME', () => {
      expect(getComparator(OrderByOption.NAME)).toBe(nameComparator)
    })

    it('returns the last-visited comparator for LAST_VISITED', () => {
      expect(getComparator(OrderByOption.LAST_VISITED)).toBe(lastVisitedComparator)
    })

    it('falls back to the name comparator for BALANCE (not a SafeItem field)', () => {
      expect(getComparator(OrderByOption.BALANCE)).toBe(nameComparator)
    })
  })
})
