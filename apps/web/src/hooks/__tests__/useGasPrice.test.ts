import { act, renderHook, waitFor } from '@/tests/test-utils'
import useGasPrice from '@/hooks/useGasPrice'
import { useCurrentChain } from '../useChains'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'

const CGW_BASE_URL = 'https://safe-client.staging.5afe.dev'

// mock useWeb3Readonly
jest.mock('../wallets/web3', () => {
  const provider = {
    getFeeData: jest.fn(() =>
      Promise.resolve({
        gasPrice: undefined,
        maxFeePerGas: BigInt('0x956e'), //38254
        maxPriorityFeePerGas: BigInt('0x136f'), //4975
      }),
    ),
  }
  return {
    useWeb3ReadOnly: jest.fn(() => provider),
  }
})
const currentChain = {
  chainId: '4',
  gasPrice: [
    {
      type: 'oracle',
      uri: 'https://api.etherscan.io/v2/api?chainid=4&module=gastracker&action=gasoracle',
      gasParameter: 'FastGasPrice',
      gweiFactor: '1000000000.000000000',
    },
    {
      type: 'oracle',
      uri: 'https://ethgasstation.info/json/ethgasAPI.json',
      gasParameter: 'fast',
      gweiFactor: '200000000.000000000',
    },
    {
      type: 'fixed',
      weiValue: '24000000000',
    },
  ],
  features: ['EIP1559'],
}
// Mock useCurrentChain
jest.mock('@/hooks/useChains', () => {
  return {
    useCurrentChain: jest.fn(() => currentChain),
  }
})

describe('useGasPrice', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    ;(useCurrentChain as jest.Mock).mockReturnValue(currentChain)
    setBaseUrl(CGW_BASE_URL)
  })

  it('should return the fetched gas price from the first oracle', async () => {
    // Mock fetch - CGW returns result wrapped with gasParameter and gweiFactor
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: {
                FastGasPrice: '47',
                suggestBaseFee: '44',
              },
              gasParameter: 'FastGasPrice',
              gweiFactor: '1000000000.000000000',
            }),
        }),
      ),
    })

    // render the hook
    const { result } = renderHook(() => useGasPrice())

    // assert the hook is loading
    expect(result.current[2]).toBe(true)

    // wait for the hook to fetch the gas price
    await act(async () => {
      await Promise.resolve()
    })

    expect(fetch).toHaveBeenCalledWith(`${CGW_BASE_URL}/v1/chains/4/gas-price`)

    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    // assert the gas price is correct
    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('47000000000')

    // assert the priority fee is correct
    expect(result.current[0]?.maxPriorityFeePerGas?.toString()).toEqual('3000000000')
  })

  it('should speed up the gas price', async () => {
    // Mock fetch - CGW returns result wrapped with gasParameter and gweiFactor
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: {
                FastGasPrice: '30',
                suggestBaseFee: '10',
              },
              gasParameter: 'FastGasPrice',
              gweiFactor: '1000000000.000000000',
            }),
        }),
      ),
    })

    // render the hook
    const { result } = renderHook(() => useGasPrice(true))

    // assert the hook is loading
    expect(result.current[2]).toBe(true)

    // wait for the hook to fetch the gas price
    await act(async () => {
      await Promise.resolve()
    })

    expect(fetch).toHaveBeenCalledWith(`${CGW_BASE_URL}/v1/chains/4/gas-price`)

    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    // assert the gas price is correct
    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('50000000000')

    // assert the priority fee is correct
    expect(result.current[0]?.maxPriorityFeePerGas?.toString()).toEqual('40000000000')
  })

  it('should fallback to fixed gas price if CGW fails', async () => {
    // Mock fetch - CGW returns error, should fallback to fixed gas price in config
    jest
      .spyOn(window, 'fetch')
      .mockImplementation(jest.fn().mockImplementation(() => Promise.reject(new Error('Failed to fetch'))))

    // render the hook
    const { result } = renderHook(() => useGasPrice())

    // assert the hook is loading
    expect(result.current[2]).toBe(true)

    await waitFor(() => {
      // assert the hook is not loading
      expect(result.current[2]).toBe(false)

      expect(fetch).toHaveBeenCalledWith(`${CGW_BASE_URL}/v1/chains/4/gas-price`)
    })

    // assert the gas price falls back to fixed value from config (24000000000)
    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('24000000000')

    // assert the priority fee comes from provider
    expect(result.current[0]?.maxPriorityFeePerGas?.toString()).toEqual('4975')
  })

  it('should fallback to a fixed gas price if all CGW oracle calls fail', async () => {
    // Mock fetch - all CGW calls fail, should fallback to fixed gas price
    jest
      .spyOn(window, 'fetch')
      .mockImplementation(jest.fn().mockImplementation(() => Promise.reject(new Error('Failed to fetch'))))

    // render the hook
    const { result } = renderHook(() => useGasPrice())

    // assert the hook is loading
    expect(result.current[2]).toBe(true)

    // wait for the hook to fetch the gas price
    await act(async () => {
      await Promise.resolve()
    })

    // CGW endpoint is called for each oracle config
    expect(fetch).toHaveBeenCalledWith(`${CGW_BASE_URL}/v1/chains/4/gas-price`)

    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    // assert the gas price is correct (fallback to fixed)
    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('24000000000')

    // assert the priority fee is correct
    expect(result.current[0]?.maxPriorityFeePerGas?.toString()).toEqual('4975')
  })

  it('should be able to set a fixed EIP 1559 gas price', async () => {
    ;(useCurrentChain as jest.Mock).mockReturnValue({
      chainId: '10',
      gasPrice: [
        {
          type: 'fixed1559',
          maxFeePerGas: '100000000',
          maxPriorityFeePerGas: '100000',
        },
      ],
      features: ['EIP1559'],
    })

    const { result } = renderHook(() => useGasPrice())

    await act(async () => {
      await Promise.resolve()
    })
    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    // assert fixed gas price as minimum of 0.1 gwei
    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('100000000')

    // assert fixed priority fee
    expect(result.current[0]?.maxPriorityFeePerGas?.toString()).toBe('100000')
  })

  it("should use the previous block's fee data if there are no oracles", async () => {
    ;(useCurrentChain as jest.Mock).mockReturnValue({
      chainId: '1',
      gasPrice: [],
      features: ['EIP1559'],
    })

    const { result } = renderHook(() => useGasPrice())

    await act(async () => {
      await Promise.resolve()
    })
    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    // assert gas price from provider
    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('38254')

    // assert priority fee from provider
    expect(result.current[0]?.maxPriorityFeePerGas?.toString()).toBe('4975')
  })

  it('should keep the previous gas price if the hook re-renders', async () => {
    // Mock fetch - CGW returns result wrapped with gasParameter and gweiFactor
    Object.defineProperty(window, 'fetch', {
      writable: true,
      value: jest
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                result: {
                  FastGasPrice: '21',
                  suggestBaseFee: '19',
                },
                gasParameter: 'FastGasPrice',
                gweiFactor: '1000000000.000000000',
              }),
          }),
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                result: {
                  FastGasPrice: '22',
                  suggestBaseFee: '19',
                },
                gasParameter: 'FastGasPrice',
                gweiFactor: '1000000000.000000000',
              }),
          }),
        ),
    })

    // render the hook
    const { result } = renderHook(() => useGasPrice())

    // assert the hook is loading
    expect(result.current[2]).toBe(true)

    expect(result.current[0]?.maxFeePerGas).toBe(undefined)

    // wait for the hook to fetch the gas price
    await act(async () => {
      await Promise.resolve()
    })

    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('21000000000')

    // render the hook again
    const { result: result2 } = renderHook(() => useGasPrice())

    // assert the hook is not loading (as a value exists)
    expect(result.current[2]).toBe(false)

    expect(result.current[0]?.maxFeePerGas?.toString()).toBe('21000000000')

    // wait for the hook to fetch the gas price
    await act(async () => {
      await Promise.resolve()
    })

    // assert the hook is not loading
    expect(result.current[2]).toBe(false)

    expect(result2.current[0]?.maxFeePerGas?.toString()).toBe('22000000000')
  })
})

describe('getTotalFee', () => {
  it('returns the totalFee', () => {
    const result = getTotalFee(1n, 100n)
    expect(result).toEqual(100n)
  })

  it('handles large numbers', () => {
    const result = getTotalFee(10000000000000000n, 123123123n)

    expect(result).toEqual(1231231230000000000000000n)
  })
})
