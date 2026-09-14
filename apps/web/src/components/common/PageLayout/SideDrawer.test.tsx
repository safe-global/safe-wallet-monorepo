import { act, render } from '@/tests/test-utils'
import SideDrawer from './SideDrawer'

jest.mock('@/features/spaces', () => ({
  SpacesEnhancedSidebar: () => <div data-testid="sidebar" />,
}))

const BELOW_MD = '(max-width:899.95px)'

type Listeners = Map<string, Set<() => void>>

const makeMediaQueryList = (query: string, matches: boolean, listeners: Listeners): MediaQueryList =>
  ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_type: string, listener: () => void) => {
      const set = listeners.get(query) ?? new Set<() => void>()
      set.add(listener)
      listeners.set(query, set)
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.get(query)?.delete(listener)
    },
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList

/** Controllable `matchMedia` so a desktop → mobile resize can be simulated. */
const setupMatchMedia = () => {
  const listeners: Listeners = new Map()
  let isMobile = false

  window.matchMedia = (query: string) => makeMediaQueryList(query, isMobile && query.includes('max-width'), listeners)

  return {
    shrinkToMobile: () => {
      isMobile = true
      act(() => {
        listeners.forEach((set) => set.forEach((listener) => listener()))
      })
    },
  }
}

describe('SideDrawer', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.useRealTimers()
    window.matchMedia = originalMatchMedia
  })

  it('renders the persistent sidebar from md up', () => {
    setupMatchMedia()
    const { container } = render(<SideDrawer isOpen onToggle={jest.fn()} />)

    expect(container.querySelector('aside')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
  })

  /**
   * Dragging a desktop window below md flips `isSmallScreen` synchronously, while the effect that
   * collapses the drawer only runs after paint. Before the migration the shared MUI Drawer carried
   * `smDrawerHidden`, so `display: none` covered that window; the Sheet's backdrop is a portal
   * sibling of its content, so CSS can no longer hide it and `open` has to be gated instead.
   */
  it('does not flash the overlay drawer when the viewport shrinks past md', () => {
    const media = setupMatchMedia()
    render(<SideDrawer isOpen onToggle={jest.fn()} />)

    media.shrinkToMobile()

    expect(window.matchMedia(BELOW_MD).matches).toBe(true)
    expect(document.querySelector('[data-slot="sheet-content"]')).not.toBeInTheDocument()
  })

  it('opens the overlay drawer on mobile once the resize window has passed', () => {
    const media = setupMatchMedia()
    const { rerender } = render(<SideDrawer isOpen={false} onToggle={jest.fn()} />)

    media.shrinkToMobile()
    act(() => jest.advanceTimersByTime(300))

    rerender(<SideDrawer isOpen onToggle={jest.fn()} />)

    expect(document.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
  })

  // Regression: opening a Safe App used to collapse the sidebar. The drawer no longer reads the
  // route at all, so the guard is that it opens on desktop and never asks to close.
  it('opens on desktop and never collapses itself', () => {
    setupMatchMedia()
    const onToggle = jest.fn()

    render(<SideDrawer isOpen onToggle={onToggle} />)

    expect(onToggle).toHaveBeenCalledWith(true)
    expect(onToggle).not.toHaveBeenCalledWith(false)
  })

  it('still collapses the sidebar on small screens', () => {
    const media = setupMatchMedia()
    const onToggle = jest.fn()

    render(<SideDrawer isOpen onToggle={onToggle} />)
    media.shrinkToMobile()

    expect(onToggle).toHaveBeenCalledWith(false)
  })

  // The sidebar's own control is the only collapse affordance; the Safe App strip is gone
  it('renders no Safe App collapse toggle', () => {
    setupMatchMedia()

    render(<SideDrawer isOpen onToggle={jest.fn()} />)

    expect(document.querySelector('[aria-label="collapse sidebar"]')).not.toBeInTheDocument()
  })
})
