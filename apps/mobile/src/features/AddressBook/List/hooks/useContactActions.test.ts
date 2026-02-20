import { renderHook } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { useContactActions } from './useContactActions'

jest.mock('tamagui', () => ({
  useTheme: () => ({
    color: {
      get: () => '#000000',
    },
    error: {
      get: () => '#FF5F72',
    },
  }),
}))

describe('useContactActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('common behavior', () => {
    it('should return two actions', () => {
      const { result } = renderHook(() => useContactActions())

      expect(result.current).toHaveLength(2)
    })

    it('should have copy action as first item', () => {
      const { result } = renderHook(() => useContactActions())

      expect(result.current[0].id).toBe('copy')
      expect(result.current[0].title).toBe('Copy address')
    })

    it('should have delete action as second item', () => {
      const { result } = renderHook(() => useContactActions())

      expect(result.current[1].id).toBe('delete')
      expect(result.current[1].title).toBe('Delete contact')
    })

    it('should mark delete action as destructive', () => {
      const { result } = renderHook(() => useContactActions())

      expect(result.current[1].attributes).toEqual({ destructive: true })
    })

    it('should set delete image color to error theme color', () => {
      const { result } = renderHook(() => useContactActions())

      expect(result.current[1].imageColor).toBe('#FF5F72')
    })
  })

  describe('platform-specific icons', () => {
    it('should have platform-specific copy icon', () => {
      const { result } = renderHook(() => useContactActions())

      const expectedIcon = Platform.select({
        ios: 'doc.on.doc',
        android: 'baseline_content_copy_24',
      })
      expect(result.current[0].image).toBe(expectedIcon)
    })

    it('should have platform-specific delete icon', () => {
      const { result } = renderHook(() => useContactActions())

      const expectedIcon = Platform.select({
        ios: 'trash',
        android: 'baseline_delete_24',
      })
      expect(result.current[1].image).toBe(expectedIcon)
    })

    it('should have platform-specific copy icon color', () => {
      const { result } = renderHook(() => useContactActions())

      const expectedColor = Platform.select({ ios: '#000000', android: '#000' })
      expect(result.current[0].imageColor).toBe(expectedColor)
    })
  })

  describe('memoization', () => {
    it('should return same reference when theme color does not change', () => {
      const { result, rerender } = renderHook(() => useContactActions())

      const firstResult = result.current

      rerender({})

      expect(result.current).toBe(firstResult)
    })
  })
})
