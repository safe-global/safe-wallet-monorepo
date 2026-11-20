import { faker } from '@faker-js/faker'
import { SimpleTxWatcher } from '@safe-global/utils/services/SimpleTxWatcher'
import { type JsonRpcProvider, type TransactionReceipt } from 'ethers'
import { waitFor } from '@/tests/test-utils'

describe('SimpleTxWatcher', () => {
  it('should resolve with the txReceipt if one is found', async () => {
    const watcher = SimpleTxWatcher.getInstance()
    const fakeReceipt: Partial<TransactionReceipt> = {
      blockNumber: faker.number.int(),
      blockHash: faker.number.hex(),
      confirmations: () => Promise.resolve(2),
    }
    const blockListeners: Function[] = []
    const mockProvider = {
      getTransactionReceipt: jest.fn().mockResolvedValue(fakeReceipt),
      getTransactionCount: jest.fn(),
      on: jest.fn().mockImplementation((blockTag, listener) => blockListeners.push(listener)),
      off: jest.fn(),
    } as unknown as JsonRpcProvider

    const result = watcher.watchTxHash('0x1234', faker.finance.ethereumAddress(), 0, mockProvider)

    expect(mockProvider.on).toHaveBeenCalledTimes(1)
    expect(mockProvider.getTransactionReceipt).not.toHaveBeenCalled()

    // Simulate a new block
    blockListeners[0]?.()

    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(1)
      expect(mockProvider.getTransactionCount).not.toHaveBeenCalled()
      expect(mockProvider.off).toHaveBeenCalledTimes(1)
    })

    const receipt = await result
    expect(receipt).toEqual(fakeReceipt)
  })

  it('should reject with if the tx has been replaced', async () => {
    const watcher = SimpleTxWatcher.getInstance()
    const blockListeners: Function[] = []
    const mockProvider = {
      getTransactionReceipt: jest.fn().mockResolvedValue(null),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      on: jest.fn().mockImplementation((blockTag, listener) => blockListeners.push(listener)),
      off: jest.fn(),
    } as unknown as JsonRpcProvider

    const result = watcher
      .watchTxHash('0x1234', faker.finance.ethereumAddress(), 0, mockProvider)
      .catch((error) => error)

    expect(mockProvider.on).toHaveBeenCalledTimes(1)
    expect(mockProvider.getTransactionReceipt).not.toHaveBeenCalled()

    // Simulate a new block
    blockListeners[0]?.()

    // In the first block the walletNonce is still 0 => nothing changes
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(1)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(1)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // simulate that the wallet executes the nonce
    ;(mockProvider.getTransactionCount as jest.Mock).mockResolvedValue(1)
    // Simulate a new block
    blockListeners[0]?.()

    // We detect that the nonce seems to be used up but we wait for 2 confirmation => nothing happens yet
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(2)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(2)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // Simulate a new block
    blockListeners[0]?.()

    // 1 more confirmation needed => nothing happens
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(3)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(3)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // Simulate a new block
    blockListeners[0]?.()

    // We reject
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(4)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(4)
      expect(mockProvider.off).toHaveBeenCalled()
    })

    expect(await result).toBe(
      'Transaction not found. It might have been replaced or cancelled in the connected wallet.',
    )
  })

  it('should resolve if receipt resolves after 1 confirmation', async () => {
    const watcher = SimpleTxWatcher.getInstance()
    const fakeReceipt: Partial<TransactionReceipt> = {
      blockNumber: faker.number.int(),
      blockHash: faker.number.hex(),
      confirmations: () => Promise.resolve(2),
    }
    const blockListeners: Function[] = []
    const mockProvider = {
      getTransactionReceipt: jest.fn().mockResolvedValue(null),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      on: jest.fn().mockImplementation((blockTag, listener) => blockListeners.push(listener)),
      off: jest.fn(),
    } as unknown as JsonRpcProvider

    const txHash = `0x${faker.number.hex()}`
    const result = watcher.watchTxHash(txHash, faker.finance.ethereumAddress(), 0, mockProvider).catch((error) => error)

    expect(mockProvider.on).toHaveBeenCalledTimes(1)
    expect(mockProvider.getTransactionReceipt).not.toHaveBeenCalled()

    // Simulate a new block
    blockListeners[0]?.()

    // In the first block the walletNonce is still 0 => nothing changes
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(1)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(1)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // simulate that the wallet executes the nonce
    ;(mockProvider.getTransactionCount as jest.Mock).mockResolvedValue(1)
    // Simulate a new block
    blockListeners[0]?.()

    // We detect that the nonce seems to be used up but we wait for 2 confirmation => nothing happens yet
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(2)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(2)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })
    ;(mockProvider.getTransactionReceipt as jest.Mock).mockResolvedValue(fakeReceipt)
    // Simulate a new block
    blockListeners[0]?.()

    // After 1 confirmation we find the receipt and do not throw anymore
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(3)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(2)
      expect(mockProvider.off).toHaveBeenCalled()
    })

    expect(await result).toBe(fakeReceipt)
  })

  it('should stop monitoring txs after cancelling the watcher', async () => {
    const watcher = SimpleTxWatcher.getInstance()
    const blockListeners: Function[] = []
    const mockProvider = {
      getTransactionReceipt: jest.fn().mockResolvedValue(null),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      on: jest.fn().mockImplementation((blockTag, listener) => blockListeners.push(listener)),
      off: jest.fn(),
    } as unknown as JsonRpcProvider
    const txHash = `0x${faker.number.hex()}`
    watcher.watchTxHash(txHash, faker.finance.ethereumAddress(), 0, mockProvider).catch((error) => error)

    expect(mockProvider.on).toHaveBeenCalledTimes(1)
    expect(mockProvider.getTransactionReceipt).not.toHaveBeenCalled()

    // Simulate a new block
    blockListeners[0]?.()

    // In the first block the walletNonce is still 0 => nothing changes
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(1)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(1)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // simulate that the wallet executes the nonce
    ;(mockProvider.getTransactionCount as jest.Mock).mockResolvedValue(1)
    // Simulate a new block
    blockListeners[0]?.()

    // We detect that the nonce seems to be used up but we wait for 2 confirmation => nothing happens yet
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(2)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(2)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // Simulate a new block
    blockListeners[0]?.()

    // 1 more confirmation needed => nothing happens
    await waitFor(() => {
      expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(3)
      expect(mockProvider.getTransactionCount).toHaveBeenCalledTimes(3)
      expect(mockProvider.off).not.toHaveBeenCalled()
    })

    // cancel the watcher
    watcher.stopWatchingTxHash(txHash)

    expect(mockProvider.off).toHaveBeenCalled()
  })
})
