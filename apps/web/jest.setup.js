// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '@/tests/server'
import { faker } from '@faker-js/faker'

// Seed faker for deterministic test data
faker.seed(123)

// Set timezone to UTC for consistent date formatting across environments
process.env.TZ = 'UTC'

// Default-mock the Gnosis Pay owner check so any component using CheckWallet or
// the tx-flow action slots in tests doesn't need to wire up useChains/wallet/web3 mocks.
// Use a plain function (not jest.fn) so `jest.resetAllMocks()` in test files doesn't
// clear the implementation. Tests that exercise Gnosis Pay can still override with
// jest.mock(...) at the file level.
const gnosisPayHooksMock = {
  __esModule: true,
  useIsGnosisPayOwner: () => [false, undefined, false],
  useGnosisPayDelayModifier: () => [undefined, undefined, false],
  useGnosisPayActions: () => ({ enqueueTx: () => undefined, executeTx: () => undefined }),
}
jest.mock('@/features/gnosispay/hooks/useIsGnosisPayOwner', () => gnosisPayHooksMock)
jest.mock('@/features/gnosispay', () => gnosisPayHooksMock)

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
