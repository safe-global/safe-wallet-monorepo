import { getModuleInstance, KnownContracts, deployAndSetUpModule } from '@gnosis.pm/zodiac'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

import { _getEditRecoveryTransactions, _getRecoverySetupTransactions } from '@/features/recovery/services/setup'
import type { JsonRpcProvider } from 'ethers'

jest.mock('@gnosis.pm/zodiac', () => ({
  ...jest.requireActual('@gnosis.pm/zodiac'),
  getModuleInstance: jest.fn(),
  deployAndSetUpModule: jest.fn(),
}))

const mockGetModuleInstance = getModuleInstance as jest.MockedFunction<typeof getModuleInstance>
const mockDeployAndSetUpModule = deployAndSetUpModule as jest.MockedFunction<typeof deployAndSetUpModule>

describe('getRecoverySetupTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return deploy Delay Modifier, enable Safe recoverer and add a Recoverer transactions', async () => {
    const delay = faker.string.numeric()
    const expiry = faker.string.numeric()
    const recoverers = [faker.finance.ethereumAddress()]
    const safeAddress = faker.finance.ethereumAddress()
    const chainId = faker.string.numeric()
    const provider = {} as JsonRpcProvider

    const expectedModuleAddress = faker.finance.ethereumAddress()
    const deployDelayModifierTx = {
      to: faker.finance.ethereumAddress(),
      data: faker.string.hexadecimal(),
      value: BigInt(0),
    }
    mockGetModuleInstance.mockReturnValue({
      interface: {
        encodeFunctionData: jest.fn().mockReturnValue(deployDelayModifierTx.data),
      },
    } as any)
    mockDeployAndSetUpModule.mockResolvedValue({
      expectedModuleAddress,
      transaction: deployDelayModifierTx,
    })

    const result = await _getRecoverySetupTransactions({
      delay,
      expiry,
      recoverers,
      chainId,
      safeAddress,
      provider,
    })

    expect(mockDeployAndSetUpModule).toHaveBeenCalledTimes(1)
    expect(mockDeployAndSetUpModule).toHaveBeenCalledWith(
      KnownContracts.DELAY,
      {
        types: ['address', 'address', 'address', 'uint256', 'uint256'],
        values: [
          safeAddress, // address _owner
          safeAddress, // address _avatar
          safeAddress, // address _target
          delay, // uint256 _cooldown
          expiry, // uint256 _expiration
        ],
      },
      provider,
      Number(chainId),
      expect.any(String),
    )

    expect(result.expectedModuleAddress).toEqual(expectedModuleAddress)
    expect(result.transactions).toHaveLength(3)

    // Deploy Delay Modifier
    expect(result.transactions[0]).toEqual({
      ...deployDelayModifierTx,
      value: '0',
    })
    // Enable Delay Modifier on Safe
    expect(result.transactions[1]).toEqual({
      to: safeAddress,
      data: expect.any(String),
      value: '0',
    })
    // Add recoverer to Delay Modifier
    expect(result.transactions[2]).toEqual({
      to: expectedModuleAddress,
      data: expect.any(String),
      value: '0',
    })
  })
})

describe('getEditRecoveryTransactions', () => {
  it('should return a setTxExpiration transaction if a new expiry is provided', async () => {
    const moduleAddress = faker.finance.ethereumAddress()

    const delay = faker.string.numeric()
    const expiry = faker.string.numeric()
    const recoverers = [faker.finance.ethereumAddress()]

    const newExpiry = faker.string.numeric({ exclude: expiry })

    const mockEncodeFunctionData = jest.fn()
    mockGetModuleInstance.mockReturnValue({
      txCooldown: () => Promise.resolve(BigInt(delay)),
      txExpiration: () => Promise.resolve(BigInt(expiry)),
      getModulesPaginated: () => Promise.resolve([recoverers]),
      interface: {
        encodeFunctionData: mockEncodeFunctionData.mockReturnValue('0x'),
      },
    } as any)

    const transactions = await _getEditRecoveryTransactions({
      provider: {} as JsonRpcProvider,
      newDelay: delay,
      newExpiry,
      newRecoverers: recoverers,
      moduleAddress,
    })

    expect(transactions).toHaveLength(1)

    expect(mockEncodeFunctionData).toHaveBeenCalledTimes(1)
    expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(1, 'setTxExpiration', [newExpiry])

    expect(transactions[0]).toEqual({
      to: moduleAddress,
      value: '0',
      data: expect.any(String),
      operation: OperationType.Call,
    })
  })

  it('should return a setTxCooldown transaction if a new delay is provided', async () => {
    const moduleAddress = faker.finance.ethereumAddress()

    const delay = faker.string.numeric()
    const expiry = faker.string.numeric()
    const recoverers = [faker.finance.ethereumAddress()]

    const newDelay = faker.string.numeric({ exclude: delay })

    const mockEncodeFunctionData = jest.fn()
    mockGetModuleInstance.mockReturnValue({
      txCooldown: () => Promise.resolve(BigInt(delay)),
      txExpiration: () => Promise.resolve(BigInt(expiry)),
      getModulesPaginated: () => Promise.resolve([recoverers]),
      interface: {
        encodeFunctionData: mockEncodeFunctionData.mockReturnValue('0x'),
      },
    } as any)

    const transactions = await _getEditRecoveryTransactions({
      provider: {} as JsonRpcProvider,
      newDelay,
      newExpiry: expiry,
      newRecoverers: recoverers,
      moduleAddress,
    })

    expect(transactions).toHaveLength(1)

    expect(mockEncodeFunctionData).toHaveBeenCalledTimes(1)
    expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(1, 'setTxCooldown', [newDelay])

    expect(transactions[0]).toEqual({
      to: moduleAddress,
      value: '0',
      data: expect.any(String),
      operation: OperationType.Call,
    })
  })

  it('should return an enableModule transaction if a new recoverer is provided', async () => {
    const moduleAddress = faker.finance.ethereumAddress()

    const delay = faker.string.numeric()
    const expiry = faker.string.numeric()
    const recoverers = [faker.finance.ethereumAddress()]

    const newRecoverers = [recoverers[0], faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]

    const mockEncodeFunctionData = jest.fn()
    mockGetModuleInstance.mockReturnValue({
      txCooldown: () => Promise.resolve(BigInt(delay)),
      txExpiration: () => Promise.resolve(BigInt(expiry)),
      getModulesPaginated: () => Promise.resolve([recoverers]),
      interface: {
        encodeFunctionData: mockEncodeFunctionData.mockReturnValue('0x'),
      },
    } as any)

    const transactions = await _getEditRecoveryTransactions({
      provider: {} as JsonRpcProvider,
      newDelay: delay,
      newExpiry: expiry,
      newRecoverers,
      moduleAddress,
    })

    expect(transactions).toHaveLength(2)

    expect(mockEncodeFunctionData).toHaveBeenCalledTimes(2)

    expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(1, 'enableModule', [newRecoverers[1]])
    expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(2, 'enableModule', [newRecoverers[2]])

    expect(transactions[0]).toEqual({
      to: moduleAddress,
      value: '0',
      data: expect.any(String),
      operation: OperationType.Call,
    })
    expect(transactions[1]).toEqual({
      to: moduleAddress,
      value: '0',
      data: expect.any(String),
      operation: OperationType.Call,
    })
  })

  it('should return a disableModule transaction if an existing recoverer is provided', async () => {
    const moduleAddress = faker.finance.ethereumAddress()

    const delay = faker.string.numeric()
    const expiry = faker.string.numeric()
    const recoverers = [faker.finance.ethereumAddress()]

    const mockEncodeFunctionData = jest.fn()
    mockGetModuleInstance.mockReturnValue({
      txCooldown: () => Promise.resolve(BigInt(delay)),
      txExpiration: () => Promise.resolve(BigInt(expiry)),
      getModulesPaginated: () => Promise.resolve([recoverers]),
      interface: {
        encodeFunctionData: mockEncodeFunctionData.mockReturnValue('0x'),
      },
    } as any)

    const transactions = await _getEditRecoveryTransactions({
      provider: {} as JsonRpcProvider,
      newDelay: delay,
      newExpiry: expiry,
      newRecoverers: [],
      moduleAddress,
    })

    expect(transactions).toHaveLength(1)

    expect(mockEncodeFunctionData).toHaveBeenCalledTimes(1)

    expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(1, 'disableModule', [SENTINEL_ADDRESS, recoverers[0]])

    expect(transactions[0]).toEqual({
      to: moduleAddress,
      value: '0',
      data: expect.any(String),
      operation: OperationType.Call,
    })
  })

  describe('existing recoverers', () => {
    it('should skip existing recoverers provided', async () => {
      const moduleAddress = faker.finance.ethereumAddress()

      const delay = faker.string.numeric()
      const expiry = faker.string.numeric()
      const recoverers = [faker.finance.ethereumAddress()]

      const newDelay = faker.string.numeric({ exclude: delay })
      const newExpiry = faker.string.numeric({ exclude: expiry })
      const newRecoverers = [recoverers[0], faker.finance.ethereumAddress()]

      const mockEncodeFunctionData = jest.fn()
      mockGetModuleInstance.mockReturnValue({
        txCooldown: () => Promise.resolve(BigInt(delay)),
        txExpiration: () => Promise.resolve(BigInt(expiry)),
        getModulesPaginated: () => Promise.resolve([recoverers]),
        interface: {
          encodeFunctionData: mockEncodeFunctionData.mockReturnValue('0x'),
        },
      } as any)

      const transactions = await _getEditRecoveryTransactions({
        provider: {} as JsonRpcProvider,
        newDelay,
        newExpiry,
        newRecoverers,
        moduleAddress,
      })

      expect(transactions).toHaveLength(3)

      expect(mockEncodeFunctionData).toHaveBeenCalledTimes(3)

      expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(1, 'setTxCooldown', [newDelay])
      expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(2, 'setTxExpiration', [newExpiry])
      expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(3, 'enableModule', [newRecoverers[1]]) // Skip existing recoverer

      expect(transactions[0]).toEqual({
        to: moduleAddress,
        value: '0',
        data: expect.any(String),
        operation: OperationType.Call,
      })
      expect(transactions[1]).toEqual({
        to: moduleAddress,
        value: '0',
        data: expect.any(String),
        operation: OperationType.Call,
      })
      expect(transactions[2]).toEqual({
        to: moduleAddress,
        value: '0',
        data: expect.any(String),
        operation: OperationType.Call,
      })
    })

    it('should handle complex recoverer mappings', async () => {
      const moduleAddress = faker.finance.ethereumAddress()

      const delay = faker.string.numeric()
      const expiry = faker.string.numeric()
      const recoverers = [
        faker.finance.ethereumAddress(),
        faker.finance.ethereumAddress(),
        faker.finance.ethereumAddress(),
      ]

      const newRecoverers = [recoverers[0], faker.finance.ethereumAddress(), recoverers[1]]

      const mockEncodeFunctionData = jest.fn()
      mockGetModuleInstance.mockReturnValue({
        txCooldown: () => Promise.resolve(BigInt(delay)),
        txExpiration: () => Promise.resolve(BigInt(expiry)),
        getModulesPaginated: () => Promise.resolve([recoverers]),
        interface: {
          encodeFunctionData: mockEncodeFunctionData.mockReturnValue('0x'),
        },
      } as any)

      const transactions = await _getEditRecoveryTransactions({
        provider: {} as JsonRpcProvider,
        newDelay: delay,
        newExpiry: expiry,
        newRecoverers,
        moduleAddress,
      })

      expect(transactions).toHaveLength(2)

      expect(mockEncodeFunctionData).toHaveBeenCalledTimes(2)

      expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(1, 'disableModule', [recoverers[1], recoverers[2]])
      expect(mockEncodeFunctionData).toHaveBeenNthCalledWith(2, 'enableModule', [newRecoverers[1]])

      expect(transactions[0]).toEqual({
        to: moduleAddress,
        value: '0',
        data: expect.any(String),
        operation: OperationType.Call,
      })
      expect(transactions[1]).toEqual({
        to: moduleAddress,
        value: '0',
        data: expect.any(String),
        operation: OperationType.Call,
      })
    })
  })
})
