import '@testing-library/jest-dom'

// jsdom implements neither matchMedia nor ResizeObserver. `useIsMobile`/`useIsTablet`
// call matchMedia on mount, and the base-ui primitives that measure their anchor
// (popover, select, tooltip, sidebar) construct a ResizeObserver.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
