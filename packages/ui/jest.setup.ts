import '@testing-library/jest-dom'

process.env.TZ = 'UTC'

// jsdom lacks the Pointer Events API that Base UI relies on
if (typeof MouseEvent !== 'undefined' && typeof globalThis.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    pointerId: number
    pointerType: string
    isPrimary: boolean

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.pointerType = params.pointerType ?? 'mouse'
      this.isPrimary = params.isPrimary ?? false
    }
  }
  globalThis.PointerEvent = PointerEvent as unknown as typeof globalThis.PointerEvent
}
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture ?? (() => false)
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture ?? (() => {})
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture ?? (() => {})
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {})
}

// Desktop by default: width queries resolve false, `(pointer: fine)` resolves true
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('pointer: fine'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
