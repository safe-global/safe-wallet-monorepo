import { type EIP1193Provider } from '@web3-onboard/core'
import { Builder } from '@safe-global/utils/tests/Builder'

export const eip1193ProviderBuilder = () =>
  Builder.new<EIP1193Provider>().with({
    disconnect: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    request: jest.fn(),
  })
