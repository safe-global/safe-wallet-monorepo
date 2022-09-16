// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect'
import 'whatwg-fetch'

jest.mock('@web3-onboard/coinbase', () => jest.fn())
jest.mock('@web3-onboard/fortmatic', () => jest.fn())
jest.mock('@web3-onboard/injected-wallets', () => jest.fn())
jest.mock('@web3-onboard/keystone/dist/index', () => jest.fn())
jest.mock('@web3-onboard/ledger', () => jest.fn())
jest.mock('@web3-onboard/portis', () => jest.fn())
jest.mock('@web3-onboard/torus', () => jest.fn())
jest.mock('@web3-onboard/trezor', () => jest.fn())
jest.mock('@web3-onboard/walletconnect', () => jest.fn())

jest.mock('@web3-onboard/injected-wallets/dist/icons/metamask', () => '')
jest.mock('@web3-onboard/coinbase/dist/icon', () => '')
jest.mock('@web3-onboard/keystone/dist/icon', () => '')
jest.mock('@web3-onboard/walletconnect/dist/icon', () => '')
jest.mock('@web3-onboard/trezor/dist/icon', () => '')
jest.mock('@web3-onboard/ledger/dist/icon', () => '')
jest.mock('@web3-onboard/fortmatic/dist/icon', () => '')
jest.mock('@web3-onboard/portis/dist/icon', () => '')
jest.mock('@web3-onboard/torus/dist/icon', () => '')

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
