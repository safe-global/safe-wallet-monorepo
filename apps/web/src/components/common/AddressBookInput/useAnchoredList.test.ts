import { renderHook, waitFor } from '@/tests/test-utils'
import { act } from 'react'
import { useAnchoredList } from './useAnchoredList'

const VIEWPORT_HEIGHT = 900

type Box = { top: number; height?: number; left?: number; width?: number }

/**
 * jsdom has no layout, so the anchor's box has to be supplied. The ref object is created once and
 * reused across renders, the way `useRef` gives it to the real component: a fresh ref each render
 * would re-run the positioning effect every time.
 */
const anchorAt = (initial: Box) => {
  const el = document.createElement('div')
  const ref = { current: el as HTMLElement | null }

  const setBox = ({ top, height = 40, left = 100, width = 320 }: Box) => {
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        left,
        right: left + width,
        width,
        height,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect
  }

  setBox(initial)

  return { ref, setBox }
}

describe('useAnchoredList', () => {
  beforeEach(() => {
    window.innerHeight = VIEWPORT_HEIGHT
  })

  it('stays hidden while closed', () => {
    const { ref } = anchorAt({ top: 100 })
    const { result } = renderHook(() => useAnchoredList(ref, false))

    expect(result.current).toEqual({ visibility: 'hidden' })
  })

  it('opens below the field, matching its left edge and width', () => {
    const { ref } = anchorAt({ top: 100 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current).toMatchObject({ position: 'fixed', left: 100, width: 320, top: 144 })
    expect(result.current.bottom).toBeUndefined()
  })

  it('caps the height at 400px even with a whole viewport below', () => {
    const { ref } = anchorAt({ top: 0 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current.maxHeight).toBe(400)
  })

  it('caps the height to the room below when that is the tighter bound', () => {
    // A 40px field at y=600 leaves 900 - 640 - 8 = 252px below, less than the 400 cap.
    const { ref } = anchorAt({ top: 600 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current.maxHeight).toBe(252)
    expect(result.current.top).toBe(644)
  })

  it('flips above the field when the room below is tight and there is more above', () => {
    // A 40px field at y=800 leaves 52px below and 792px above, so it anchors to the bottom.
    const { ref } = anchorAt({ top: 800 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current.bottom).toBe(VIEWPORT_HEIGHT - 800 + 4)
    expect(result.current.top).toBeUndefined()
    expect(result.current.maxHeight).toBe(400)
  })

  it('stays below when the room below is tight but the room above is tighter', () => {
    // 20px below, 12px above. Neither side fits, so it must not flip into the smaller one.
    window.innerHeight = 100
    const { ref } = anchorAt({ top: 20, height: 52 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current.top).toBe(76)
    expect(result.current.bottom).toBeUndefined()
  })

  it('never shrinks below 120px, even with no room at all', () => {
    window.innerHeight = 100
    const { ref } = anchorAt({ top: 20, height: 52 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current.maxHeight).toBe(120)
  })

  it('leaves the style hidden when there is no anchor to measure', () => {
    const { ref } = anchorAt({ top: 100 })
    ref.current = null
    const { result } = renderHook(() => useAnchoredList(ref, true))

    expect(result.current).toEqual({ visibility: 'hidden' })
  })

  it('repositions when any ancestor scrolls', async () => {
    const { ref, setBox } = anchorAt({ top: 100 })
    const { result } = renderHook(() => useAnchoredList(ref, true))
    expect(result.current.top).toBe(144)

    setBox({ top: 300 })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    await waitFor(() => expect(result.current.top).toBe(344))
  })

  it('repositions on resize', async () => {
    const { ref, setBox } = anchorAt({ top: 100 })
    const { result } = renderHook(() => useAnchoredList(ref, true))

    setBox({ top: 100, width: 500 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    await waitFor(() => expect(result.current.width).toBe(500))
  })

  it('hides again once closed', () => {
    const { ref } = anchorAt({ top: 100 })
    const { result, rerender } = renderHook(({ open }: { open: boolean }) => useAnchoredList(ref, open), {
      initialProps: { open: true },
    })
    expect(result.current.position).toBe('fixed')

    rerender({ open: false })

    expect(result.current).toEqual({ visibility: 'hidden' })
  })

  it('stops listening once unmounted', () => {
    const remove = jest.spyOn(window, 'removeEventListener')
    const { ref } = anchorAt({ top: 100 })
    const { unmount } = renderHook(() => useAnchoredList(ref, true))

    unmount()

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), true)
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
    remove.mockRestore()
  })
})
