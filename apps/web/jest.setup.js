// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '@/tests/server'
import { faker } from '@faker-js/faker'

// Seed faker for deterministic test data
faker.seed(123)

// jsdom lacks the Pointer Events API that Base UI components (shadcn/ui) rely on.
// Polyfill only what's missing so interaction tests (e.g. clicking a Base UI Checkbox)
// don't throw "PointerEvent is not defined". Purely additive.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.pointerType = params.pointerType ?? 'mouse'
      this.isPrimary = params.isPrimary ?? false
    }
  }
  globalThis.PointerEvent = PointerEvent
}
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture ?? (() => false)
  Element.prototype.setPointerCapture = Element.prototype.setPointerCapture ?? (() => {})
  Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture ?? (() => {})
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? (() => {})
}

// jsdom lacks matchMedia, which the `useIsMobile` hook (and other responsive hooks that
// replace MUI's useMediaQuery) rely on. Default to desktop: width-based queries (useIsMobile)
// resolve false, while `(pointer: fine)` resolves true so MUI-X date pickers render their
// editable desktop variant in tests. Additive.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: typeof query === 'string' && query.includes('pointer: fine'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Set timezone to UTC for consistent date formatting across environments
process.env.TZ = 'UTC'

jest.mock('@web3-onboard/coinbase', () => jest.fn())
jest.mock('@web3-onboard/injected-wallets', () => ({ ProviderLabel: { MetaMask: 'MetaMask' } }))
jest.mock('@web3-onboard/walletconnect', () => jest.fn())

// Mock Datadog RUM SDK to prevent it from loading during tests
jest.mock(
  '@datadog/browser-rum',
  () => ({
    datadogRum: {
      init: jest.fn(),
      addAction: jest.fn(),
      addError: jest.fn(),
      setGlobalContextProperty: jest.fn(),
      getInitConfiguration: jest.fn(),
    },
  }),
  { virtual: true },
)

const mockOnboardState = {
  chains: [],
  walletModules: [],
  wallets: [],
  accountCenter: {},
}

jest.mock('@web3-onboard/core', () => () => ({
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  setChain: jest.fn(),
  state: {
    select: (key) => ({
      subscribe: (next) => {
        next(mockOnboardState[key])

        return {
          unsubscribe: jest.fn(),
        }
      },
    }),
    get: () => mockOnboardState,
  },
}))

// This is required for jest.spyOn to work with imported modules.
// After Next 13, imported modules have `configurable: false` for named exports,
// which means that `jest.spyOn` cannot modify the exported function.
const defineProperty = Object.defineProperty
Object.defineProperty = (obj, prop, desc) => {
  if (prop !== 'prototype') {
    desc.configurable = true
  }
  return defineProperty(obj, prop, desc)
}

beforeAll(() => {
  server.listen()
})

afterEach(() => server.resetHandlers())
afterAll(() => server.close())
