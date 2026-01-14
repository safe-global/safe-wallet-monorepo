import { waitFor } from '@testing-library/react'
import { act } from 'react'
import { _getRemainingTimeout } from '@/services/tx/txMonitor'
import * as txEvents from '@/services/tx/txEvents'
import * as txMonitor from '@/services/tx/txMonitor'

import { toBeHex } from 'ethers'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { BrowserProvider, type JsonRpcProvider, type TransactionReceipt } from 'ethers'
import { faker } from '@faker-js/faker'
import { SimpleTxWatcher } from '@/utils/SimpleTxWatcher'

const { waitForTx, waitForRelayedTx } = txMonitor

const provider = new BrowserProvider(MockEip1193Provider) as unknown as JsonRpcProvider

const setupFetchStub = (data: any) => () => {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    status: 200,
    ok: true,
  })
}

describe('txMonitor', () => {
  const simpleTxWatcherInstance = SimpleTxWatcher.getInstance()

  let txDispatchSpy = jest.spyOn(txEvents, 'txDispatch')
  // let simpleWatcherSpy = jest.spyOn(SimpleTxWatcher, 'getInstance')
  const safeAddress = toBeHex('0x123', 20)

  let watchTxHashSpy = jest.spyOn(simpleTxWatcherInstance, 'watchTxHash')

  beforeEach(() => {
    jest.useFakeTimers()
    jest.resetAllMocks()

    txDispatchSpy = jest.spyOn(txEvents, 'txDispatch')
    jest.spyOn(provider, 'waitForTransaction')
    watchTxHashSpy = jest.spyOn(simpleTxWatcherInstance, 'watchTxHash')
  })

  describe('waitForTx', () => {
    // Not mined/validated:
    it("emits a FAILED event if waitForTransaction isn't blocking and no receipt was returned", async () => {
      // Can return null if waitForTransaction is non-blocking:
      // https://docs.ethers.io/v5/single-page/#/v5/api/providers/provider/-%23-Provider-waitForTransaction
      const receipt = null as unknown as TransactionReceipt
      watchTxHashSpy.mockImplementation(() => Promise.resolve(receipt))
      await waitForTx(provider, ['0x0'], '0x0', safeAddress, faker.finance.ethereumAddress(), 1, 1, '11155111')

      expect(txDispatchSpy).toHaveBeenCalledWith('FAILED', {
        txId: '0x0',
        error: expect.any(Error),
        nonce: 1,
        chainId: '11155111',
        safeAddress,
      })
    })

    it('emits a REVERTED event if the tx reverted', async () => {
      const receipt = {
        status: 0,
      } as TransactionReceipt

      watchTxHashSpy.mockImplementation(() => Promise.resolve(receipt))
      await waitForTx(provider, ['0x0'], '0x0', safeAddress, faker.finance.ethereumAddress(), 1, 1, '11155111')

      expect(txDispatchSpy).toHaveBeenCalledWith('REVERTED', {
        nonce: 1,
        txId: '0x0',
        error: new Error('Transaction reverted by EVM.'),
        chainId: '11155111',
        safeAddress,
      })
    })

    it('emits a FAILED event if waitForTransaction throws', async () => {
      watchTxHashSpy.mockImplementation(() => Promise.reject(new Error('Test error.')))
      await waitForTx(provider, ['0x0'], '0x0', safeAddress, faker.finance.ethereumAddress(), 1, 1, '11155111')

      expect(txDispatchSpy).toHaveBeenCalledWith('FAILED', {
        txId: '0x0',
        error: new Error('Test error.'),
        nonce: 1,
        chainId: '11155111',
        safeAddress,
      })
    })
  })

  describe('waitForRelayedTx', () => {
    const chainId = '1'
    const safeAddress = toBeHex('0x1', 20)

    it("emits a PROCESSED event if taskStatus 'ExecSuccess'", async () => {
      const mockData = {
        task: {
          taskState: 'ExecSuccess',
        },
      }
      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockData))

      const mockFetch = jest.spyOn(global, 'fetch')

      waitForRelayedTx('0x1', ['0x2'], chainId, safeAddress, 1)

      act(() => {
        jest.advanceTimersByTime(15_000 + 1)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(txDispatchSpy).toHaveBeenCalledWith('PROCESSED', {
          txId: '0x2',
          safeAddress,
          nonce: 1,
          chainId,
        })
      })

      // The relay timeout should have been cancelled
      txDispatchSpy.mockClear()
      act(() => {
        jest.advanceTimersByTime(3 * 60_000 + 1)
      })
      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it("emits a REVERTED event if taskStatus 'ExecReverted'", async () => {
      const mockData = {
        task: {
          taskState: 'ExecReverted',
        },
      }
      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockData))

      const mockFetch = jest.spyOn(global, 'fetch')

      waitForRelayedTx('0x1', ['0x2'], chainId, safeAddress, 1)

      act(() => {
        jest.advanceTimersByTime(15_000 + 1)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(txDispatchSpy).toHaveBeenCalledWith('REVERTED', {
          nonce: 1,
          txId: '0x2',
          error: new Error(`Relayed transaction reverted by EVM.`),
          chainId,
          safeAddress,
        })
      })

      // The relay timeout should have been cancelled
      txDispatchSpy.mockClear()
      act(() => {
        jest.advanceTimersByTime(3 * 60_000 + 1)
      })
      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it("emits a FAILED event if taskStatus 'Blacklisted'", async () => {
      const mockData = {
        task: {
          taskState: 'Blacklisted',
        },
      }
      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockData))

      const mockFetch = jest.spyOn(global, 'fetch')

      waitForRelayedTx('0x1', ['0x2'], chainId, safeAddress, 1)

      act(() => {
        jest.advanceTimersByTime(15_000 + 1)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(txDispatchSpy).toHaveBeenCalledWith('FAILED', {
          nonce: 1,
          txId: '0x2',
          error: new Error(`Relayed transaction was blacklisted by relay provider.`),
          chainId,
          safeAddress,
        })
      })

      // The relay timeout should have been cancelled
      txDispatchSpy.mockClear()
      act(() => {
        jest.advanceTimersByTime(3 * 60_000 + 1)
      })
      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it("emits a FAILED event if taskStatus 'Cancelled'", async () => {
      const mockData = {
        task: {
          taskState: 'Cancelled',
        },
      }
      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockData))

      const mockFetch = jest.spyOn(global, 'fetch')

      waitForRelayedTx('0x1', ['0x2'], chainId, safeAddress, 1)

      act(() => {
        jest.advanceTimersByTime(15_000 + 1)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(txDispatchSpy).toHaveBeenCalledWith('FAILED', {
          nonce: 1,
          txId: '0x2',
          error: new Error(`Relayed transaction was cancelled by relay provider.`),
          chainId,
          safeAddress,
        })
      })

      // The relay timeout should have been cancelled
      txDispatchSpy.mockClear()
      act(() => {
        jest.advanceTimersByTime(3 * 60_000 + 1)
      })
      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it("emits a FAILED event if taskStatus 'NotFound'", async () => {
      const mockData = {
        task: {
          taskState: 'NotFound',
        },
      }
      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockData))

      const mockFetch = jest.spyOn(global, 'fetch')

      waitForRelayedTx('0x1', ['0x2'], chainId, safeAddress, 1)

      act(() => {
        jest.advanceTimersByTime(15_000 + 1)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(txDispatchSpy).toHaveBeenCalledWith('FAILED', {
          nonce: 1,
          txId: '0x2',
          error: new Error(`Relayed transaction was not found.`),
          chainId,
          safeAddress,
        })
      })

      // The relay timeout should have been cancelled
      txDispatchSpy.mockClear()
      act(() => {
        jest.advanceTimersByTime(3 * 60_000 + 1)
      })
      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it('emits a FAILED event if the tx relaying timed out', async () => {
      const mockData = {
        task: {
          taskState: 'WaitingForConfirmation',
        },
      }
      global.fetch = jest.fn().mockImplementation(setupFetchStub(mockData))

      waitForRelayedTx('0x1', ['0x2'], chainId, safeAddress, 1)

      act(() => {
        jest.advanceTimersByTime(3 * 60_000 + 1)
      })

      expect(txDispatchSpy).toHaveBeenCalledWith('FAILED', {
        nonce: 1,
        txId: '0x2',
        error: new Error('Transaction not relayed in 3 minutes. Be aware that it might still be relayed.'),
        chainId,
        safeAddress,
      })
    })
  })
})

describe('getRemainingTimeout', () => {
  const DefaultTimeout = 1

  it('returns 1 if submission is older than 1 minute', () => {
    const result = _getRemainingTimeout(DefaultTimeout, Date.now() - DefaultTimeout * 60_000)

    expect(result).toBe(1)
  })

  it('returns default timeout in milliseconds if no submission time was passed', () => {
    const result = _getRemainingTimeout(DefaultTimeout)

    expect(result).toBe(DefaultTimeout * 60_000)
  })

  it('returns remaining timeout', () => {
    const passedMinutes = DefaultTimeout - 0.4
    const result = _getRemainingTimeout(DefaultTimeout, Date.now() - passedMinutes * 60_000)

    expect(result).toBe((DefaultTimeout - passedMinutes) * 60_000)
  })
})
