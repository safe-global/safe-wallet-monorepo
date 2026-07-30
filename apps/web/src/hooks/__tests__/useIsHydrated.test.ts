import { renderHook } from '@testing-library/react'
import { useIsHydrated } from '../useIsHydrated'

describe('useIsHydrated', () => {
  it('returns true after mount', () => {
    const { result } = renderHook(() => useIsHydrated())

    expect(result.current).toBe(true)
  })

  it('returns false on the first render, before the mount effect runs', () => {
    const renders: boolean[] = []

    renderHook(() => {
      const isHydrated = useIsHydrated()
      renders.push(isHydrated)
      return isHydrated
    })

    expect(renders[0]).toBe(false)
    expect(renders[renders.length - 1]).toBe(true)
  })
})
