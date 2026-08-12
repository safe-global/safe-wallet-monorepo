import { act, renderHook } from '@testing-library/react'
import useMediaQuery, { LG_UP_QUERY, MD_DOWN_QUERY, SM_DOWN_QUERY } from './useMediaQuery'

/**
 * These queries exist to preserve the MUI breakpoints the app was designed against. The shadcn
 * migration swapped several components onto `useIsMobile` (shadcn's stock hook at 768px), which
 * moved their layout switch 168px from where MUI's `sm` had it — so the exact values matter and are
 * pinned here rather than left to be re-derived.
 *
 * MUI defaults: xs 0, sm 600, md 900, lg 1200, xl 1536. `down(k)` is `max-width: k - 0.05px`,
 * `up(k)` is `min-width: k`.
 */
describe('media query constants', () => {
  it('matches MUI breakpoints.down("sm")', () => {
    expect(SM_DOWN_QUERY).toBe('(max-width:599.95px)')
  })

  it('matches MUI breakpoints.down("md")', () => {
    expect(MD_DOWN_QUERY).toBe('(max-width:899.95px)')
  })

  it('matches MUI breakpoints.up("lg")', () => {
    expect(LG_UP_QUERY).toBe('(min-width:1200px)')
  })

  it("does not use shadcn's 768px mobile breakpoint for the sm tier", () => {
    // Guards the specific regression: `useIsMobile` (768px) standing in for MUI's `sm` (600px).
    expect(SM_DOWN_QUERY).not.toContain('767')
    expect(SM_DOWN_QUERY).not.toContain('768')
  })
})

const stubMatchMedia = (initialMatch: boolean) => {
  const listeners = new Set<EventListenerOrEventListenerObject>()
  let isMatching = initialMatch

  window.matchMedia = (query: string) => ({
    get matches() {
      return isMatching
    },
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener)
    },
    dispatchEvent: () => false,
  })

  return {
    get listenerCount() {
      return listeners.size
    },
    setMatches: (nextMatch: boolean) => {
      isMatching = nextMatch
      const event = new Event('change')
      listeners.forEach((listener) => (typeof listener === 'function' ? listener(event) : listener.handleEvent(event)))
    },
  }
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('reports the current match on the very first render', () => {
    stubMatchMedia(true)

    const renders: boolean[] = []
    renderHook(() => renders.push(useMediaQuery(MD_DOWN_QUERY)))

    // A post-paint correction in an effect makes dialogs/layouts paint the wrong mode for a frame.
    expect(renders[0]).toBe(true)
  })

  it('re-renders when the media query starts matching', () => {
    const media = stubMatchMedia(false)

    const { result } = renderHook(() => useMediaQuery(SM_DOWN_QUERY))
    expect(result.current).toBe(false)

    act(() => media.setMatches(true))
    expect(result.current).toBe(true)
  })

  it('stops listening once unmounted', () => {
    const media = stubMatchMedia(false)

    const { unmount } = renderHook(() => useMediaQuery(LG_UP_QUERY))
    expect(media.listenerCount).toBe(1)

    unmount()
    expect(media.listenerCount).toBe(0)
  })

  it('returns false instead of throwing where matchMedia is unavailable', () => {
    Reflect.deleteProperty(window, 'matchMedia')

    const { result } = renderHook(() => useMediaQuery(MD_DOWN_QUERY))

    expect(result.current).toBe(false)
  })
})
