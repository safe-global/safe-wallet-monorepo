import { renderHook } from '@testing-library/react'
import useGlobalSearchFilter from '../useGlobalSearchFilter'

interface TestItem {
  name: string
  address: string
}

const items: TestItem[] = [
  { name: 'Payroll', address: '0xabc123' },
  { name: 'Treasury', address: '0xdef456' },
  { name: 'My account', address: '0xghi789' },
]

describe('useGlobalSearchFilter', () => {
  describe('with key', () => {
    it('returns all items when query is empty', () => {
      const { result } = renderHook(() => useGlobalSearchFilter(items, '', 'name'))
      expect(result.current).toEqual(items)
    })

    it('filters items by key match', () => {
      const { result } = renderHook(() => useGlobalSearchFilter(items, 'pay', 'name'))
      expect(result.current).toEqual([{ name: 'Payroll', address: '0xabc123' }])
    })

    it('is case-insensitive', () => {
      const { result } = renderHook(() => useGlobalSearchFilter(items, 'TREASURY', 'name'))
      expect(result.current).toEqual([{ name: 'Treasury', address: '0xdef456' }])
    })

    it('returns empty array when nothing matches', () => {
      const { result } = renderHook(() => useGlobalSearchFilter(items, 'nonexistent', 'name'))
      expect(result.current).toEqual([])
    })

    it('trims whitespace from query', () => {
      const { result } = renderHook(() => useGlobalSearchFilter(items, '  pay  ', 'name'))
      expect(result.current).toEqual([{ name: 'Payroll', address: '0xabc123' }])
    })
  })

  describe('with callback', () => {
    it('returns all items when query is empty', () => {
      const filterFn = jest.fn()
      const { result } = renderHook(() => useGlobalSearchFilter(items, '', filterFn))
      expect(result.current).toEqual(items)
      expect(filterFn).not.toHaveBeenCalled()
    })

    it('filters using the callback', () => {
      const filterFn = (item: TestItem, query: string) => item.address.includes(query)
      const { result } = renderHook(() => useGlobalSearchFilter(items, '0xdef', filterFn))
      expect(result.current).toEqual([{ name: 'Treasury', address: '0xdef456' }])
    })

    it('removes items when callback returns false', () => {
      const filterFn = () => false
      const { result } = renderHook(() => useGlobalSearchFilter(items, 'anything', filterFn))
      expect(result.current).toEqual([])
    })
  })
})
