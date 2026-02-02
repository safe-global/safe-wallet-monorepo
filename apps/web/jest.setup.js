// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '@/tests/server'
import { faker } from '@faker-js/faker'

// Seed faker for deterministic test data
faker.seed(123)

// Set timezone to UTC for consistent date formatting across environments
process.env.TZ = 'UTC'

jest.mock('@web3-onboard/coinbase', () => jest.fn())
jest.mock('@web3-onboard/injected-wallets', () => ({ ProviderLabel: { MetaMask: 'MetaMask' } }))
jest.mock('@web3-onboard/walletconnect', () => jest.fn())

// Mock Datadog SDK to prevent it from loading during tests
jest.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    init: jest.fn(),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  },
}))

jest.mock('@datadog/browser-rum', () => ({
  datadogRum: {
    init: jest.fn(),
    addError: jest.fn(),
    setGlobalContextProperty: jest.fn(),
    getInitConfiguration: jest.fn(),
  },
}))

// Mock Sentry SDK to prevent it from loading during tests
jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  ErrorBoundary: ({ children }) => children,
}))

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
