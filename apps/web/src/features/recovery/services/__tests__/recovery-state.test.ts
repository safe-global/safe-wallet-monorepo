import { faker } from '@faker-js/faker'
import { id, zeroPadValue } from 'ethers'
import { JsonRpcProvider } from 'ethers'
import cloneDeep from 'lodash/cloneDeep'
import type { TransactionAddedEvent, Delay } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import type { TransactionReceipt } from 'ethers'

import {
  _getRecoveryStateItem,
  _getRecoveryQueueItemTimestamps,
  _getSafeCreationReceipt,
  _isMaliciousRecovery,
} from '../recovery-state'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'
import { getMultiSendCallOnlyDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Interface } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { getModuleInstance, KnownContracts, ContractAbis } from '@gnosis.pm/zodiac'
import { createMockWeb3Provider } from '@safe-global/utils/tests/web3Provider'
import { SENTINEL_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

jest.mock('@/hooks/wallets/web3')

const mockUseWeb3ReadOnly = useWeb3ReadOnly as jest.MockedFunction<typeof useWeb3ReadOnly>

const latestSafeVersion = getLatestSafeVersion(
  chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build(),
)
const PRE_MULTI_SEND_CALL_ONLY_VERSIONS = ['1.0.0', '1.1.1']
const SUPPORTED_MULTI_SEND_CALL_ONLY_VERSIONS = [
  '1.3.0',
  // '1.4.1', TODO: Uncomment when safe-deployments is updated >1.25.0
  latestSafeVersion,
]

const DELAY_INTERFACE = new Interface(ContractAbis[KnownContracts.DELAY])

describe('recovery-state', () => {
  beforeEach(() => {
    // Clear memoization cache
    _getSafeCreationReceipt.cache.clear?.()
  })

  describe('isMaliciousRecovery', () => {
    describe('non-MultiSend', () => {
      it('should return true if the transaction is not calling the Safe itself', () => {
        const chainId = '1'
        const version = latestSafeVersion
        const safeAddress = faker.finance.ethereumAddress()

        const transaction = {
          to: faker.finance.ethereumAddress(), // Not Safe
          data: '0x',
        }

        expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(true)
      })

      it('should return false if the transaction is calling the Safe itself', () => {
        const chainId = '1'
        const version = latestSafeVersion
        const safeAddress = faker.finance.ethereumAddress()

        const transaction = {
          to: safeAddress, // Safe
          data: '0x',
        }

        expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(false)
      })
    })

    describe('MultiSend', () => {
      ;[...PRE_MULTI_SEND_CALL_ONLY_VERSIONS, ...SUPPORTED_MULTI_SEND_CALL_ONLY_VERSIONS].forEach((version) => {
        it(`should return true if the transaction is not an official MultiSend address for Safe version ${version}`, () => {
          const chainId = '1'
          const safeAddress = faker.finance.ethereumAddress()

          const safeAbi = getSafeSingletonDeployment({ network: chainId, version })!.abi
          const safeInterface = new Interface(safeAbi)

          const multiSendAbi =
            getMultiSendCallOnlyDeployment({ network: chainId, version }) ??
            getMultiSendCallOnlyDeployment({ network: chainId, version: '1.3.0' })
          const multiSendInterface = new Interface(multiSendAbi!.abi)

          const multiSendData = encodeMultiSendData([
            {
              to: safeAddress,
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 1]),
              operation: 0,
            },
            {
              to: safeAddress,
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 2]),
              operation: 0,
            },
          ])

          const transaction = {
            to: faker.finance.ethereumAddress(), // Not official MultiSend
            data: multiSendInterface.encodeFunctionData('multiSend', [multiSendData]),
          }

          expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(true)
        })
      })
      ;[...PRE_MULTI_SEND_CALL_ONLY_VERSIONS, ...SUPPORTED_MULTI_SEND_CALL_ONLY_VERSIONS].forEach((version) => {
        it(`should return true if the transaction is an official MultiSend call and not every transaction in the batch calls the Safe itself for Safe version ${version}`, () => {
          const chainId = '1'
          const version = latestSafeVersion
          const safeAddress = faker.finance.ethereumAddress()

          const safeAbi = getSafeSingletonDeployment({ network: chainId, version })!.abi
          const safeInterface = new Interface(safeAbi)

          const multiSendDeployment =
            getMultiSendCallOnlyDeployment({ network: chainId, version }) ??
            getMultiSendCallOnlyDeployment({ network: chainId, version: '1.3.0' })
          const multiSendInterface = new Interface(multiSendDeployment!.abi)

          const multiSendData = encodeMultiSendData([
            {
              to: faker.finance.ethereumAddress(), // Not Safe
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 1]),
              operation: 0,
            },
            {
              to: faker.finance.ethereumAddress(), // Not Safe
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 2]),
              operation: 0,
            },
          ])

          const transaction = {
            to: multiSendDeployment!.networkAddresses[chainId],
            data: multiSendInterface.encodeFunctionData('multiSend', [multiSendData]),
          }

          expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(true)
        })
      })

      SUPPORTED_MULTI_SEND_CALL_ONLY_VERSIONS.forEach((version) => {
        it(`should return false if the transaction is an official MultiSend call and every transaction in the batch calls the Safe itself for Safe version ${version}`, () => {
          const chainId = '1'
          const safeAddress = faker.finance.ethereumAddress()

          const safeAbi = getSafeSingletonDeployment({ network: chainId, version })!.abi
          const safeInterface = new Interface(safeAbi)

          const multiSendDeployment = getMultiSendCallOnlyDeployment({ network: chainId, version })!
          const multiSendInterface = new Interface(multiSendDeployment.abi)

          const multiSendData = encodeMultiSendData([
            {
              to: safeAddress,
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 1]),
              operation: 0,
            },
            {
              to: safeAddress,
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 2]),
              operation: 0,
            },
          ])

          const transaction = {
            to: multiSendDeployment.networkAddresses[chainId],
            data: multiSendInterface.encodeFunctionData('multiSend', [multiSendData]),
          }

          expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(false)
        })
      })

      PRE_MULTI_SEND_CALL_ONLY_VERSIONS.forEach((version) => {
        it(`should return false if the transaction is an official MultiSend call for Safe version ${version} (below the initial MultiSend contract version)`, () => {
          const chainId = '1'
          const safeAddress = faker.finance.ethereumAddress()

          const safeAbi = getSafeSingletonDeployment({ network: chainId, version })!.abi
          const safeInterface = new Interface(safeAbi)

          const multiSendDeployment = getMultiSendCallOnlyDeployment({ network: chainId, version: '1.3.0' })!
          const multiSendInterface = new Interface(multiSendDeployment.abi)

          const multiSendData = encodeMultiSendData([
            {
              to: safeAddress,
              value: '0',
              data: safeInterface.encodeFunctionData('addOwnerWithThreshold', [faker.finance.ethereumAddress(), 1]),
              operation: 0,
            },
          ])

          const transaction = {
            to: multiSendDeployment.networkAddresses[chainId],
            data: multiSendInterface.encodeFunctionData('multiSend', [multiSendData]),
          }

          expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(false)
        })
      })
    })
  })

  describe('getRecoveryQueueItemTimestamps', () => {
    it('should return a recovery queue item timestamps', async () => {
      const delayModifier = {
        txCreatedAt: () => Promise.resolve(BigInt(1)),
      } as unknown as Delay
      const transactionAdded = {
        args: {
          queueNonce: 0n,
        },
      } as TransactionAddedEvent.Log
      const delay = 1n
      const expiry = 2n

      const item = await _getRecoveryQueueItemTimestamps({
        delayModifier,
        transactionAdded,
        delay,
        expiry,
      })

      expect(item).toStrictEqual({
        timestamp: 1_000n,
        validFrom: 2_000n,
        expiresAt: 4_000n,
      })
    })

    it('should return a recovery queue item timestamps with expiresAt null if expiry is zero', async () => {
      const delayModifier = {
        txCreatedAt: () => Promise.resolve(BigInt(1)),
      } as unknown as Delay
      const transactionAdded = {
        args: {
          queueNonce: 0n,
        },
      } as TransactionAddedEvent.Log
      const delay = 1n
      const expiry = 0n

      const item = await _getRecoveryQueueItemTimestamps({
        delayModifier,
        transactionAdded,
        delay,
        expiry,
      })

      expect(item).toStrictEqual({
        timestamp: 1_000n,
        validFrom: 2_000n,
        expiresAt: null,
      })
    })
  })

  describe('getSafeCreationReceipt', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return the Safe creation receipt', async () => {
      const transactionService = faker.internet.url({ appendSlash: false })
      const safeAddress = faker.finance.ethereumAddress()
      const transactionHash = `0x${faker.string.hexadecimal()}`
      const receipt = {
        blockHash: faker.string.alphanumeric(),
      } as TransactionReceipt

      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({ transactionHash }),
          status: 200,
          ok: true,
        })
      })

      const provider = {
        getTransactionReceipt: () => Promise.resolve(receipt),
      } as unknown as JsonRpcProvider
      mockUseWeb3ReadOnly.mockReturnValue(provider)

      const creationReceipt = await _getSafeCreationReceipt({
        transactionService,
        safeAddress,
        provider,
      })

      expect(receipt).toStrictEqual(creationReceipt)
    })

    it('should memoize the Safe creation receipt', async () => {
      const transactionService = faker.internet.url({ appendSlash: false })
      const safeAddress = faker.finance.ethereumAddress()
      const transactionHash = `0x${faker.string.hexadecimal()}`
      const receipt = {
        blockHash: faker.string.alphanumeric(),
      } as TransactionReceipt

      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({ transactionHash }),
          status: 200,
          ok: true,
        })
      })

      const provider = {
        getTransactionReceipt: () => Promise.resolve(receipt),
      } as unknown as JsonRpcProvider
      mockUseWeb3ReadOnly.mockReturnValue(provider)

      Array.from({ length: 3 }).forEach(async () => {
        await _getSafeCreationReceipt({
          transactionService,
          safeAddress,
          provider,
        })
      })

      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the Safe creation receipt cannot be fetched', async () => {
      const transactionService = faker.internet.url({ appendSlash: false })
      const safeAddress = faker.finance.ethereumAddress()

      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          status: 500,
          ok: false,
        })
      })

      const provider = new JsonRpcProvider()
      mockUseWeb3ReadOnly.mockReturnValue(provider)

      expect(
        _getSafeCreationReceipt({
          transactionService,
          safeAddress,
          provider,
        }),
      ).rejects.toThrow('Error fetching Safe creation details')
    })
  })

  describe('getRecoveryState', () => {
    it('should return the recovery state from the Safe creation block', async () => {
      const safeAddress = faker.finance.ethereumAddress()
      const chainId = '1'
      const version = '1.3.0'
      const transactionService = faker.internet.url({ appendSlash: false })
      const transactionHash = `0x${faker.string.hexadecimal()}`
      const safeCreationReceipt = {
        blockNumber: faker.number.int(),
      } as TransactionReceipt
      const transactionAddedReceipt = {
        from: faker.finance.ethereumAddress(),
      } as TransactionReceipt

      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          json: () => Promise.resolve({ transactionHash }),
          status: 200,
          ok: true,
        })
      })

      const recoverers = [faker.finance.ethereumAddress()]
      const expiry = 0n
      const delay = 69420n
      const txNonce = 2n
      const queueNonce = 4n
      const transactionsAdded = [
        {
          args: {
            queueNonce: 2n,
            to: safeAddress,
            value: 0n,
            data: '0x',
          },
        },
        {
          args: {
            queueNonce: 3n,
            to: faker.finance.ethereumAddress(), // Malicious
            value: 0n,
            data: '0x',
          },
        },
        {
          args: {
            queueNonce: 4n,
            to: safeAddress,
            value: 0n,
            data: '0x',
          },
          removed: true, // Reorg
        } as unknown,
      ] as Array<TransactionAddedEvent.InputTuple>

      const topics = [id('TransactionAdded(uint256,bytes32,address,uint256,bytes,uint8)')]
      const queryFilterMock = jest.fn()
      const defaultTransactionAddedFilter = {
        getTopicFilter: jest.fn().mockResolvedValue([...topics]),
      }

      const mockProvider = createMockWeb3Provider([
        {
          signature: DELAY_INTERFACE.getFunction('getModulesPaginated')?.selector!,
          returnType: 'raw',
          returnValue: DELAY_INTERFACE.encodeFunctionResult('getModulesPaginated', [recoverers, SENTINEL_ADDRESS]),
        },
        {
          signature: DELAY_INTERFACE.getFunction('txExpiration')?.selector!,
          returnType: 'uint256',
          returnValue: expiry,
        },
        {
          signature: DELAY_INTERFACE.getFunction('txCooldown')?.selector!,
          returnType: 'uint256',
          returnValue: delay,
        },
        {
          signature: DELAY_INTERFACE.getFunction('txNonce')?.selector!,
          returnType: 'uint256',
          returnValue: txNonce,
        },
        {
          signature: DELAY_INTERFACE.getFunction('queueNonce')?.selector!,
          returnType: 'uint256',
          returnValue: queueNonce,
        },
      ])
      ;(mockProvider.getTransactionReceipt as jest.MockedFunction<JsonRpcProvider['getTransactionReceipt']>)
        .mockResolvedValueOnce(safeCreationReceipt)
        .mockResolvedValue(transactionAddedReceipt)

      const mockDelayModifierAddress = faker.finance.ethereumAddress()

      const delayModifier = getModuleInstance(KnownContracts.DELAY, mockDelayModifierAddress, mockProvider)

      const patchedDelayModifier = {
        ...delayModifier,
        filters: {
          TransactionAdded: () => cloneDeep(defaultTransactionAddedFilter),
        },
        getAddress: jest.fn().mockResolvedValue(mockDelayModifierAddress),
        txCreatedAt: jest
          .fn()
          .mockResolvedValueOnce(420n)
          .mockResolvedValueOnce(69420n)
          .mockResolvedValueOnce(6942069n),
        queryFilter: queryFilterMock.mockImplementation(() => Promise.resolve(transactionsAdded)),
      }

      const recoveryState = await _getRecoveryStateItem({
        delayModifier: patchedDelayModifier as unknown as Delay,
        safeAddress,
        transactionService,
        provider: mockProvider,
        chainId,
        version,
      })

      expect({
        ...recoveryState,
        recoverers: recoveryState.recoverers.map((recoverer) => recoverer.toLowerCase()),
      }).toEqual({
        address: await delayModifier.getAddress(),
        recoverers,
        expiry,
        delay,
        txNonce,
        queueNonce,
        queue: [
          {
            ...transactionsAdded[0],
            timestamp: 420n * 1_000n,
            validFrom: (420n + delay) * 1_000n,
            expiresAt: null,
            isMalicious: false,
            executor: transactionAddedReceipt.from,
          },
          {
            ...transactionsAdded[1],
            timestamp: 69420n * 1_000n,
            validFrom: (69420n + delay) * 1_000n,
            expiresAt: null,
            isMalicious: true,
            executor: transactionAddedReceipt.from,
          },
        ],
      })
      expect(queryFilterMock).toHaveBeenCalledWith(
        [...topics, [zeroPadValue('0x02', 32), zeroPadValue('0x03', 32)]],
        safeCreationReceipt.blockNumber,
        'latest',
      )
    })

    it('should not query data if the queueNonce equals the txNonce', async () => {
      const safeAddress = faker.finance.ethereumAddress()
      const chainId = '1'
      const version = '1.3.0'
      const transactionService = faker.internet.url({ appendSlash: true })

      const recoverers = [faker.finance.ethereumAddress()]
      const expiry = 0n
      const delay = 69420n
      const txNonce = 2n
      const queueNonce = 2n

      const mockProvider = createMockWeb3Provider([
        {
          signature: DELAY_INTERFACE.getFunction('getModulesPaginated')?.selector!,
          returnType: 'raw',
          returnValue: DELAY_INTERFACE.encodeFunctionResult('getModulesPaginated', [recoverers, SENTINEL_ADDRESS]),
        },
        {
          signature: DELAY_INTERFACE.getFunction('txExpiration')?.selector!,
          returnType: 'uint256',
          returnValue: expiry,
        },
        {
          signature: DELAY_INTERFACE.getFunction('txCooldown')?.selector!,
          returnType: 'uint256',
          returnValue: delay,
        },
        {
          signature: DELAY_INTERFACE.getFunction('txNonce')?.selector!,
          returnType: 'uint256',
          returnValue: txNonce,
        },
        {
          signature: DELAY_INTERFACE.getFunction('queueNonce')?.selector!,
          returnType: 'uint256',
          returnValue: queueNonce,
        },
      ])

      const queryFilterMock = jest.fn()
      const defaultTransactionAddedFilter = {
        address: faker.finance.ethereumAddress(),
        topics: [id('TransactionAdded(uint256,bytes32,address,uint256,bytes,uint8)')],
      }

      const mockDelayModifierAddress = faker.finance.ethereumAddress()

      const delayModifier = getModuleInstance(KnownContracts.DELAY, mockDelayModifierAddress, mockProvider)

      const patchedDelayModifier = {
        ...delayModifier,
        filters: {
          TransactionAdded: () => cloneDeep(defaultTransactionAddedFilter),
        },
        getAddress: jest.fn().mockResolvedValue(mockDelayModifierAddress),
        txCreatedAt: jest
          .fn()
          .mockResolvedValueOnce(420n)
          .mockResolvedValueOnce(69420n)
          .mockResolvedValueOnce(6942069n),
        queryFilter: queryFilterMock,
      }

      const recoveryState = await _getRecoveryStateItem({
        delayModifier: patchedDelayModifier as unknown as Delay,
        safeAddress,
        transactionService,
        provider: mockProvider,
        chainId,
        version,
      })

      expect({
        ...recoveryState,
        recoverers: recoveryState.recoverers.map((recoverer) => recoverer.toLowerCase()),
      }).toEqual({
        address: await delayModifier.getAddress(),
        recoverers,
        expiry,
        delay,
        txNonce,
        queueNonce,
        queue: [],
      })
      expect(queryFilterMock).not.toHaveBeenCalled()
    })
  })
})
