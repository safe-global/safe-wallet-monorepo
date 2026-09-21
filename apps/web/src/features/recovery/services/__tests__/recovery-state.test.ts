import { faker } from '@faker-js/faker'
import { id, zeroPadValue } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import cloneDeep from 'lodash/cloneDeep'
import type { TransactionAddedEvent, Delay } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'
import type { TransactionReceipt } from 'ethers'

import {
  _getRecoveryStateItem,
  _getRecoveryQueueItemTimestamps,
  _isMaliciousRecovery,
  _addedTransactionsCache,
} from '../recovery-state'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { getMultiSendCallOnlyDeployment, getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import { Interface } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { getModuleInstance, KnownContracts, ContractAbis } from '@gnosis.pm/zodiac'
import { createMockWeb3Provider } from '@safe-global/utils/tests/web3Provider'
import { SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'

const latestSafeVersion = getLatestSafeVersion(
  chainBuilder().with({ chainId: '1', recommendedMasterCopyVersion: '1.4.1' }).build(),
)
const PRE_MULTI_SEND_CALL_ONLY_VERSIONS = ['1.0.0', '1.1.1']
const SUPPORTED_MULTI_SEND_CALL_ONLY_VERSIONS = [
  '1.3.0',
  // '1.4.1', TODO: Uncomment when safe-deployments is updated >1.25.0
  latestSafeVersion,
]

const chainId = '1' // Used for test data setup (deployment lookups)
const DELAY_INTERFACE = new Interface(ContractAbis[KnownContracts.DELAY])

describe('recovery-state', () => {
  beforeEach(() => {
    _addedTransactionsCache.clear()
  })

  describe('isMaliciousRecovery', () => {
    describe('non-MultiSend', () => {
      it('should return true if the transaction is not calling the Safe itself', () => {
        const version = latestSafeVersion
        const safeAddress = faker.finance.ethereumAddress()

        const transaction = {
          to: faker.finance.ethereumAddress(), // Not Safe
          data: '0x',
        }

        expect(_isMaliciousRecovery({ chainId, version, safeAddress, transaction })).toBe(true)
      })

      it('should return false if the transaction is calling the Safe itself', () => {
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

  describe('queryAddedTransactions', () => {
    const TOPIC = id('TransactionAdded(uint256,bytes32,address,uint256,bytes,uint8)')
    const BLOCK_TIME = 12

    function setup({
      txNonce,
      queueNonce,
      createdAt,
      latestBlock,
      queryFilter,
      address = faker.finance.ethereumAddress(),
    }: {
      txNonce: bigint
      queueNonce: bigint
      createdAt: bigint
      latestBlock: number
      queryFilter: jest.Mock
      address?: string
    }) {
      const safeAddress = faker.finance.ethereumAddress()

      const mockProvider = createMockWeb3Provider([
        {
          signature: DELAY_INTERFACE.getFunction('getModulesPaginated')?.selector!,
          returnType: 'raw',
          returnValue: DELAY_INTERFACE.encodeFunctionResult('getModulesPaginated', [
            [faker.finance.ethereumAddress()],
            SENTINEL_ADDRESS,
          ]),
        },
        { signature: DELAY_INTERFACE.getFunction('txExpiration')?.selector!, returnType: 'uint256', returnValue: 0n },
        { signature: DELAY_INTERFACE.getFunction('txCooldown')?.selector!, returnType: 'uint256', returnValue: 60n },
        { signature: DELAY_INTERFACE.getFunction('txNonce')?.selector!, returnType: 'uint256', returnValue: txNonce },
        {
          signature: DELAY_INTERFACE.getFunction('queueNonce')?.selector!,
          returnType: 'uint256',
          returnValue: queueNonce,
        },
      ])
      ;(mockProvider.getTransactionReceipt as jest.Mock).mockResolvedValue({
        from: faker.finance.ethereumAddress(),
      } as TransactionReceipt)
      mockProvider.getBlockNumber = jest.fn().mockResolvedValue(latestBlock)
      const getBlock = jest.fn(async (blockNumber: number) => ({ timestamp: blockNumber * BLOCK_TIME }))
      mockProvider.getBlock = getBlock as unknown as JsonRpcProvider['getBlock']

      const delayModifier = {
        ...getModuleInstance(KnownContracts.DELAY, address, mockProvider),
        filters: { TransactionAdded: () => ({ getTopicFilter: jest.fn().mockResolvedValue([TOPIC]) }) },
        getAddress: jest.fn().mockResolvedValue(address),
        txCreatedAt: jest.fn().mockResolvedValue(createdAt),
        queryFilter,
      } as unknown as Delay

      const run = () =>
        _getRecoveryStateItem({
          delayModifier,
          safeAddress,
          provider: mockProvider,
          chainId,
          version: '1.3.0',
        })

      return { run, getBlock }
    }

    // blockNumber 0 is far behind every `latestBlock` below, so these are cacheable by default
    const event = (queueNonce: bigint, blockNumber = 0) => ({
      args: { queueNonce, to: faker.finance.ethereumAddress(), value: 0n, data: '0x' },
      blockNumber,
    })

    it('should find recently queued txs in the first window without bisecting', async () => {
      const queryFilter = jest.fn().mockResolvedValue([event(0n)])
      const { run, getBlock } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      const { queue } = await run()

      expect(queue).toHaveLength(1)
      expect(queryFilter).toHaveBeenCalledTimes(1)
      expect(queryFilter).toHaveBeenCalledWith(expect.anything(), 90_001, 100_000)
      expect(getBlock).not.toHaveBeenCalled()
    })

    it('should walk back up to three windows before bisecting', async () => {
      const queryFilter = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([event(0n)])
      const { run, getBlock } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      const { queue } = await run()

      expect(queue).toHaveLength(1)
      expect(queryFilter.mock.calls.map(([, from, to]) => [from, to])).toEqual([
        [90_001, 100_000],
        [80_001, 90_000],
        [70_001, 80_000],
      ])
      expect(getBlock).not.toHaveBeenCalled()
    })

    it('should bisect to the block the oldest queued tx was created and scan forward from there', async () => {
      const queryFilter = jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([event(0n), event(1n)])
      const { run, getBlock } = setup({
        txNonce: 0n,
        queueNonce: 2n,
        createdAt: BigInt(55_000 * BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      const { queue } = await run()

      expect(queue).toHaveLength(2)
      expect(queryFilter.mock.calls.map(([, from, to]) => [from, to])).toEqual([
        [90_001, 100_000],
        [80_001, 90_000],
        [70_001, 80_000],
        [55_000, 64_999],
        [65_000, 70_000],
      ])
      expect(getBlock.mock.calls.length).toBeLessThanOrEqual(17)
    })

    it('should stop at genesis without bisecting when the chain is shorter than three windows', async () => {
      const queryFilter = jest.fn().mockResolvedValue([])
      const { run, getBlock } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 25_000,
        queryFilter,
      })

      const { queue } = await run()

      expect(queue).toEqual([])
      expect(queryFilter.mock.calls.map(([, from, to]) => [from, to])).toEqual([
        [15_001, 25_000],
        [5_001, 15_000],
        [0, 5_000],
      ])
      expect(getBlock).not.toHaveBeenCalled()
    })

    it('should halve the window when the RPC rejects the range', async () => {
      const queryFilter = jest
        .fn()
        .mockRejectedValueOnce(new Error('range exceeds limit'))
        .mockRejectedValueOnce(new Error('range exceeds limit'))
        .mockResolvedValue([event(0n)])
      const { run } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      const { queue } = await run()

      expect(queue).toHaveLength(1)
      expect(queryFilter.mock.calls.map(([, from, to]) => [from, to])).toEqual([
        [90_001, 100_000],
        [95_001, 100_000],
        [97_501, 100_000],
      ])
    })

    it('should rethrow once the window cannot shrink any further', async () => {
      const error = new Error('range exceeds limit')
      const queryFilter = jest.fn().mockRejectedValue(error)
      const { run } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      await expect(run()).rejects.toThrow(error)
      expect(queryFilter).toHaveBeenCalledTimes(5)
    })

    it('should throw if the queued tx has no creation time', async () => {
      const queryFilter = jest.fn().mockResolvedValue([])
      const { run } = setup({ txNonce: 0n, queueNonce: 1n, createdAt: 0n, latestBlock: 100_000, queryFilter })

      await expect(run()).rejects.toThrow('Could not determine when recovery 0 was queued')
      expect(queryFilter).toHaveBeenCalledTimes(3)
    })

    it('should not query logs again for nonces already found in the session', async () => {
      const queryFilter = jest.fn().mockResolvedValue([event(0n)])
      const { run } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      const first = await run()
      const second = await run()

      expect(first.queue).toHaveLength(1)
      expect(second.queue).toHaveLength(1)
      expect(queryFilter).toHaveBeenCalledTimes(1)
    })

    it('should only query logs for nonces missing from the cache', async () => {
      const address = faker.finance.ethereumAddress()
      const firstQueryFilter = jest.fn().mockResolvedValue([event(0n)])
      await setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter: firstQueryFilter,
        address,
      }).run()

      const secondQueryFilter = jest.fn().mockResolvedValue([event(1n)])
      const { queue } = await setup({
        txNonce: 0n,
        queueNonce: 2n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter: secondQueryFilter,
        address,
      }).run()

      expect(queue.map((item) => item.args.queueNonce)).toEqual([0n, 1n])
      expect(secondQueryFilter).toHaveBeenCalledTimes(1)
      expect(secondQueryFilter.mock.calls[0][0][1]).toEqual([zeroPadValue('0x01', 32)])
    })

    it('should not cache reorged events', async () => {
      const queryFilter = jest.fn().mockResolvedValue([{ ...event(0n), removed: true }])
      const { run } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      await run()
      await run()

      expect(queryFilter).toHaveBeenCalledTimes(2)
    })

    it('should not cache events still within reorg range of the chain head', async () => {
      const queryFilter = jest.fn().mockResolvedValue([event(0n, 99_995)])
      const { run } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      const first = await run()
      const second = await run()

      expect(first.queue).toHaveLength(1)
      expect(second.queue).toHaveLength(1)
      expect(queryFilter).toHaveBeenCalledTimes(2)
    })

    it('should cache events buried deeper than the reorg range', async () => {
      const queryFilter = jest.fn().mockResolvedValue([event(0n, 99_000)])
      const { run } = setup({
        txNonce: 0n,
        queueNonce: 1n,
        createdAt: BigInt(BLOCK_TIME),
        latestBlock: 100_000,
        queryFilter,
      })

      await run()
      await run()

      expect(queryFilter).toHaveBeenCalledTimes(1)
    })
  })

  describe('getRecoveryState', () => {
    it('should return the recovery state from the Safe creation block', async () => {
      const safeAddress = faker.finance.ethereumAddress()
      const version = '1.3.0'
      const latestBlock = 5_000
      const transactionAddedReceipt = {
        from: faker.finance.ethereumAddress(),
      } as TransactionReceipt

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
      ;(
        mockProvider.getTransactionReceipt as jest.MockedFunction<JsonRpcProvider['getTransactionReceipt']>
      ).mockResolvedValue(transactionAddedReceipt)
      mockProvider.getBlockNumber = jest.fn().mockResolvedValue(latestBlock)

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
      expect(queryFilterMock).toHaveBeenCalledTimes(1)
      expect(queryFilterMock).toHaveBeenCalledWith(
        [...topics, [zeroPadValue('0x02', 32), zeroPadValue('0x03', 32)]],
        0,
        latestBlock,
      )
    })

    it('should not query data if the queueNonce equals the txNonce', async () => {
      const safeAddress = faker.finance.ethereumAddress()
      const version = '1.3.0'

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
