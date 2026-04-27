import { renderHook } from '@testing-library/react'
import { useIsTopbarElevated, useTopbarElevation } from '../useTopbarElevation'

describe('useTopbarElevation', () => {
  it('does not elevate the topbar by default', () => {
    const { result } = renderHook(() => useIsTopbarElevated())
    expect(result.current).toBe(false)
  })

  it('elevates the topbar while a modal is open', () => {
    const { result: elevatedResult } = renderHook(() => useIsTopbarElevated())
    const { rerender } = renderHook(({ isOpen }) => useTopbarElevation('recovery', isOpen), {
      initialProps: { isOpen: false },
    })

    expect(elevatedResult.current).toBe(false)

    rerender({ isOpen: true })
    expect(elevatedResult.current).toBe(true)
  })

  it('resets elevation when the modal closes', () => {
    const { result: elevatedResult } = renderHook(() => useIsTopbarElevated())
    const { rerender } = renderHook(({ isOpen }) => useTopbarElevation('tx-flow', isOpen), {
      initialProps: { isOpen: true },
    })

    expect(elevatedResult.current).toBe(true)

    rerender({ isOpen: false })
    expect(elevatedResult.current).toBe(false)
  })

  it('resets elevation on unmount', () => {
    const { result: elevatedResult } = renderHook(() => useIsTopbarElevated())
    const { unmount } = renderHook(() => useTopbarElevation('tx-flow', true))

    expect(elevatedResult.current).toBe(true)

    unmount()
    expect(elevatedResult.current).toBe(false)
  })

  it('stays elevated while at least one modal is open', () => {
    const { result: elevatedResult } = renderHook(() => useIsTopbarElevated())
    const recovery = renderHook(() => useTopbarElevation('recovery', true))
    const txFlow = renderHook(() => useTopbarElevation('tx-flow', true))

    expect(elevatedResult.current).toBe(true)

    recovery.unmount()
    expect(elevatedResult.current).toBe(true)

    txFlow.unmount()
    expect(elevatedResult.current).toBe(false)
  })
})
