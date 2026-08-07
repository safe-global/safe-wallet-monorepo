import { renderHook } from '@/tests/test-utils'
import useUnlockBodyScroll, {
  isAnyOverlayOpen,
  isBodyScrollLocked,
  unlockBodyScrollIfStuck,
} from '@/hooks/useUnlockBodyScroll'

const lockBody = () => {
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = '15px'
}

const addOverlay = (markup: string) => {
  const el = document.createElement('div')
  el.innerHTML = markup
  document.body.appendChild(el)
  return el
}

describe('useUnlockBodyScroll helpers', () => {
  afterEach(() => {
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  describe('isBodyScrollLocked', () => {
    it('detects overflow: hidden', () => {
      document.body.style.overflow = 'hidden'
      expect(isBodyScrollLocked(document.body)).toBe(true)
    })

    it('detects overflowY: hidden', () => {
      document.body.style.overflowY = 'hidden'
      expect(isBodyScrollLocked(document.body)).toBe(true)
    })

    it('is false for an unlocked body', () => {
      expect(isBodyScrollLocked(document.body)).toBe(false)
    })
  })

  describe('isAnyOverlayOpen', () => {
    it('is true while a MUI modal is open', () => {
      addOverlay('<div class="MuiModal-root"></div>')
      expect(isAnyOverlayOpen(document)).toBe(true)
    })

    it('ignores closed (hidden) MUI modals', () => {
      addOverlay('<div class="MuiModal-root MuiModal-hidden"></div>')
      expect(isAnyOverlayOpen(document)).toBe(false)
    })

    it('is true while a Base UI dialog is open', () => {
      addOverlay('<div data-slot="dialog-content"></div>')
      expect(isAnyOverlayOpen(document)).toBe(true)
    })

    it('is true while a Vaul drawer is open', () => {
      addOverlay('<div data-slot="drawer-content"></div>')
      expect(isAnyOverlayOpen(document)).toBe(true)
    })

    it('is false when nothing is open', () => {
      expect(isAnyOverlayOpen(document)).toBe(false)
    })
  })

  describe('unlockBodyScrollIfStuck', () => {
    it('clears a stuck lock when no overlay is open', () => {
      lockBody()

      expect(unlockBodyScrollIfStuck(document)).toBe(true)
      expect(document.body.style.overflow).toBe('')
      expect(document.body.style.paddingRight).toBe('')
    })

    it('does NOT clear the lock while an overlay is still open', () => {
      lockBody()
      addOverlay('<div data-slot="dialog-content"></div>')

      expect(unlockBodyScrollIfStuck(document)).toBe(false)
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('does nothing when the body is not locked', () => {
      expect(unlockBodyScrollIfStuck(document)).toBe(false)
    })
  })
})

describe('useUnlockBodyScroll', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('clears a stuck lock after the debounce once mutations occur', () => {
    const { unmount } = renderHook(() => useUnlockBodyScroll())

    // Simulate a locker leaving the body stuck with no overlay open.
    document.body.style.overflow = 'hidden'

    // Flush the MutationObserver microtask, then the debounce timer.
    return Promise.resolve().then(() => {
      jest.advanceTimersByTime(100)
      expect(document.body.style.overflow).toBe('')
      unmount()
    })
  })

  it('re-checks and clears once the overlay unmounts, even if the first check bailed', async () => {
    const { unmount } = renderHook(() => useUnlockBodyScroll())

    // Overlay still present (e.g. mid exit-transition) while the body is locked.
    const overlay = document.createElement('div')
    overlay.className = 'MuiModal-root'
    document.body.appendChild(overlay)
    document.body.style.overflow = 'hidden'

    await Promise.resolve() // flush the MutationObserver callback
    jest.advanceTimersByTime(100)
    expect(document.body.style.overflow).toBe('hidden') // not cleared: overlay is open

    // Overlay unmounts — this childList change must trigger a re-check.
    overlay.remove()
    await Promise.resolve()
    jest.advanceTimersByTime(100)
    expect(document.body.style.overflow).toBe('')

    unmount()
  })

  it('disconnects the observer on unmount', () => {
    const disconnect = jest.fn()
    const observe = jest.fn()
    const original = global.MutationObserver
    global.MutationObserver = jest.fn(() => ({
      observe,
      disconnect,
      takeRecords: jest.fn(),
    })) as unknown as typeof MutationObserver

    const { unmount } = renderHook(() => useUnlockBodyScroll())
    expect(observe).toHaveBeenCalled()
    unmount()
    expect(disconnect).toHaveBeenCalled()

    global.MutationObserver = original
  })
})
