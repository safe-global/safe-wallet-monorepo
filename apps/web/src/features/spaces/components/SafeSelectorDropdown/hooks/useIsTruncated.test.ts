import { renderHook } from '@testing-library/react'
import { useIsTruncated } from './useIsTruncated'

// jsdom lacks ResizeObserver; a noop stub is enough since tests drive the element's box explicitly.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub

const makeElement = (scrollWidth: number, clientWidth: number): HTMLElement => {
  const el = document.createElement('span')
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth })
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth })
  return el
}

describe('useIsTruncated', () => {
  it('returns true when content overflows the element', () => {
    const ref = { current: makeElement(200, 100) }
    const { result } = renderHook(() => useIsTruncated(ref, 'text'))
    expect(result.current).toBe(true)
  })

  it('returns false when content fits', () => {
    const ref = { current: makeElement(80, 100) }
    const { result } = renderHook(() => useIsTruncated(ref, 'text'))
    expect(result.current).toBe(false)
  })

  it('treats an exact fit as not truncated', () => {
    const ref = { current: makeElement(100, 100) }
    const { result } = renderHook(() => useIsTruncated(ref, 'text'))
    expect(result.current).toBe(false)
  })

  it('does nothing when the ref is empty', () => {
    const ref = { current: null }
    const { result } = renderHook(() => useIsTruncated(ref, 'text'))
    expect(result.current).toBe(false)
  })

  it('re-measures when observedValue changes', () => {
    const el = makeElement(80, 100)
    const ref = { current: el }
    const { result, rerender } = renderHook(({ value }) => useIsTruncated(ref, value), {
      initialProps: { value: 'short' },
    })
    expect(result.current).toBe(false)

    // Simulate the rendered text growing past the element's width.
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 300 })
    rerender({ value: 'a much longer name' })
    expect(result.current).toBe(true)
  })
})
