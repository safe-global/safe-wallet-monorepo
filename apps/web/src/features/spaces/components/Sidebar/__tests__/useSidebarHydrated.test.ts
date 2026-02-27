import { renderHook } from '@testing-library/react'
import { useSidebarHydrated } from '../hooks/useSidebarHydrated'

describe('useSidebarHydrated', () => {
  it('transitions from false to true after mount (hydration complete)', () => {
    const { result } = renderHook(() => useSidebarHydrated())

    expect(result.current).toBe(true)
  })

  it('persists true state on re-renders', () => {
    const { result, rerender } = renderHook(() => useSidebarHydrated())

    expect(result.current).toBe(true)

    // Re-render should not change the state
    rerender()
    expect(result.current).toBe(true)

    rerender()
    expect(result.current).toBe(true)
  })
})
