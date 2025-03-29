import * as creationUtils from '@/components/new-safe/create/logic/index'
import { getAvailableSaltNonce } from '@/components/new-safe/create/logic/utils'
import { faker } from '@faker-js/faker'
import { chainBuilder } from '@/tests/builders/chains'
import { type ReplayedSafeProps } from '@/store/slices'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import * as web3Hooks from '@/hooks/wallets/web3'
import { type JsonRpcProvider, id } from 'ethers'
import { Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import { predictAddressBasedOnReplayData } from '@/features/multichain/utils/utils'

// Proxy Factory 1.3.0 creation code
const mockProxyCreationCode =
  '0x608060405234801561001057600080fd5b506040516101e63803806101e68339818101604052602081101561003357600080fd5b8101908080519060200190929190505050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156100ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806101c46022913960400191505060405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505060ab806101196000396000f3fe608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033496e76616c69642073696e676c65746f6e20616464726573732070726f7669646564'

describe('getAvailableSaltNonce', () => {
  jest.spyOn(creationUtils, 'computeNewSafeAddress').mockReturnValue(Promise.resolve(faker.finance.ethereumAddress()))

  let mockDeployProps: ReplayedSafeProps

  beforeAll(() => {
    mockDeployProps = {
      safeAccountConfig: {
        threshold: 1,
        owners: [faker.finance.ethereumAddress()],
        fallbackHandler: faker.finance.ethereumAddress(),
        data: faker.string.hexadecimal({ casing: 'lower', length: 64 }),
        to: faker.finance.ethereumAddress(),
        paymentReceiver: faker.finance.ethereumAddress(),
        payment: 0,
        paymentToken: ZERO_ADDRESS,
      },
      factoryAddress: faker.finance.ethereumAddress(),
      masterCopy: faker.finance.ethereumAddress(),
      safeVersion: '1.4.1',
      saltNonce: '0',
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return initial nonce if no contract is deployed to the computed address', async () => {
    jest.spyOn(web3Hooks, 'createWeb3ReadOnly').mockReturnValue({
      getCode: jest.fn().mockReturnValue('0x'),
      call: jest.fn().mockImplementation((tx: { data: string; to: string }) => {
        if (tx.data.startsWith(id('proxyCreationCode()').slice(0, 10))) {
          return Safe_proxy_factory__factory.createInterface().encodeFunctionResult('proxyCreationCode', [
            mockProxyCreationCode,
          ])
        } else {
          throw new Error('Unsupported Operation')
        }
      }),
      getNetwork: jest.fn().mockReturnValue({ chainId: '1' }),
    } as unknown as JsonRpcProvider)

    const initialNonce = faker.string.numeric()
    const mockChain = chainBuilder().with({ chainId: '1' }).build()

    const result = await getAvailableSaltNonce({}, { ...mockDeployProps, saltNonce: initialNonce }, [mockChain], [])

    expect(result).toEqual(initialNonce)
  })

  it('should return an increased nonce if a contract is deployed to the computed address', async () => {
    let requiredTries = 3
    jest.spyOn(web3Hooks, 'createWeb3ReadOnly').mockReturnValue({
      getCode: jest
        .fn()
        .mockImplementation(() => (requiredTries-- > 0 ? faker.string.hexadecimal({ length: 64 }) : '0x')),
      call: jest.fn().mockImplementation((tx: { data: string; to: string }) => {
        if (tx.data.startsWith(id('proxyCreationCode()').slice(0, 10))) {
          return Safe_proxy_factory__factory.createInterface().encodeFunctionResult('proxyCreationCode', [
            mockProxyCreationCode,
          ])
        } else {
          throw new Error('Unsupported Operation')
        }
      }),
      getNetwork: jest.fn().mockReturnValue({ chainId: '1' }),
    } as unknown as JsonRpcProvider)
    const initialNonce = faker.string.numeric()
    const mockChain = chainBuilder().with({ chainId: '1' }).build()
    const result = await getAvailableSaltNonce({}, { ...mockDeployProps, saltNonce: initialNonce }, [mockChain], [])

    expect(result).toEqual((Number(initialNonce) + 3).toString())
  })

  it('should skip known addresses without checking getCode', async () => {
    const mockProvider = {
      getCode: jest.fn().mockImplementation(() => '0x'),
      call: jest.fn().mockImplementation((tx: { data: string; to: string }) => {
        if (tx.data.startsWith(id('proxyCreationCode()').slice(0, 10))) {
          return Safe_proxy_factory__factory.createInterface().encodeFunctionResult('proxyCreationCode', [
            mockProxyCreationCode,
          ])
        } else {
          throw new Error('Unsupported Operation')
        }
      }),
      getNetwork: jest.fn().mockReturnValue({ chainId: '1' }),
    } as unknown as JsonRpcProvider
    const initialNonce = faker.string.numeric()

    const replayedProps = { ...mockDeployProps, saltNonce: initialNonce }
    const knownAddresses = [await predictAddressBasedOnReplayData(replayedProps, mockProvider)]
    jest.spyOn(web3Hooks, 'createWeb3ReadOnly').mockReturnValue(mockProvider)
    const mockChain = chainBuilder().build()
    const result = await getAvailableSaltNonce({}, replayedProps, [mockChain], knownAddresses)

    // The known address (initialNonce) will be skipped
    expect(result).toEqual((Number(initialNonce) + 1).toString())
    expect(mockProvider.getCode).toHaveBeenCalledTimes(1)
  })

  it('should check cross chain', async () => {
    const mockMainnet = chainBuilder().with({ chainId: '1' }).build()
    const mockGnosis = chainBuilder().with({ chainId: '100' }).build()

    // We mock that on GnosisChain the first nonce is already deployed
    const mockGnosisProvider = {
      getCode: jest.fn().mockImplementation(() => '0x'),
      call: jest.fn().mockImplementation((tx: { data: string; to: string }) => {
        if (tx.data.startsWith(id('proxyCreationCode()').slice(0, 10))) {
          return Safe_proxy_factory__factory.createInterface().encodeFunctionResult('proxyCreationCode', [
            mockProxyCreationCode,
          ])
        } else {
          throw new Error('Unsupported Operation')
        }
      }),
      getNetwork: jest.fn().mockReturnValue({ chainId: '100' }),
    } as unknown as JsonRpcProvider

    // We Mock that on Mainnet the first two nonces are already deployed
    let mainnetTriesRequired = 2
    const mockMainnetProvider = {
      getCode: jest
        .fn()
        .mockImplementation(() => (mainnetTriesRequired-- > 0 ? faker.string.hexadecimal({ length: 64 }) : '0x')),
      call: jest.fn().mockImplementation((tx: { data: string; to: string }) => {
        if (tx.data.startsWith(id('proxyCreationCode()').slice(0, 10))) {
          return Safe_proxy_factory__factory.createInterface().encodeFunctionResult('proxyCreationCode', [
            mockProxyCreationCode,
          ])
        } else {
          throw new Error('Unsupported Operation')
        }
      }),
      getNetwork: jest.fn().mockReturnValue({ chainId: '1' }),
    } as unknown as JsonRpcProvider
    const initialNonce = faker.string.numeric()

    const replayedProps = { ...mockDeployProps, saltNonce: initialNonce }
    jest.spyOn(web3Hooks, 'createWeb3ReadOnly').mockImplementation((chain) => {
      if (chain.chainId === '100') {
        return mockGnosisProvider
      }
      if (chain.chainId === '1') {
        return mockMainnetProvider
      }
      throw new Error('Web3Provider not found')
    })

    const result = await getAvailableSaltNonce({}, replayedProps, [mockMainnet, mockGnosis], [])

    // The known address (initialNonce) will be skipped
    expect(result).toEqual((Number(initialNonce) + 2).toString())
  })
})
