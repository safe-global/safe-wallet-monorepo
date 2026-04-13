import { renderHook } from '@testing-library/react'
import { useSidebarHydrated } from '../useSidebarHydrated'

describe('useSidebarHydrated', () => {
  it('returns true after mount', () => {
    const { result } = renderHook(() => useSidebarHydrated())

    expect(result.current).toBe(true)
  })
})
