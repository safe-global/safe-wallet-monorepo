import { renderHook, waitFor } from '@testing-library/react'
import { type FeeData } from 'ethers'
import { useDefaultGasPrice, getTotalFee, getTotalFeeFormatted } from '@safe-global/utils/hooks/useDefaultGasPrice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const mockGetFeeData = jest.fn()
const mockFetchFn = jest.fn()

jest.mock('@safe-global/utils/hooks/useIntervalCounter', () => ({
  useIntervalCounter: jest.fn(() => [0, jest.fn()]),
}))

const makeFeeData = (overrides: Partial<FeeData> = {}): FeeData =>
  ({
    gasPrice: 20000000000n,
    maxFeePerGas: 40000000000n,
    maxPriorityFeePerGas: 2000000000n,
    toJSON: () => ({}),
    ...overrides,
  }) as unknown as FeeData

const makeChain = (gasPrice: Chain['gasPrice'], features: string[] = []): Chain =>
  ({ chainId: '1', gasPrice, features }) as unknown as Chain

const stableProvider = { getFeeData: mockGetFeeData } as never
const makeProvider = () => stableProvider

const mockFetchOk = (json: unknown) => {
  mockFetchFn.mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(json) } as Response))
}

const mockFetchNotOk = () => {
  mockFetchFn.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 500 } as Response))
}

const mockFetchReject = (error: Error) => {
  mockFetchFn.mockImplementationOnce(() => Promise.reject(error))
}

describe('useDefaultGasPrice', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetFeeData.mockResolvedValue(makeFeeData())
    global.fetch = mockFetchFn
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('fixed gas price', () => {
    it('should return a fixed gas price', async () => {
      const chain = makeChain([{ type: 'fixed', weiValue: '30000000000' }])

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(30000000000n)
      expect(result.current[0]?.maxPriorityFeePerGas).toBeUndefined()
    })

    it('should return a fixed EIP-1559 gas price', async () => {
      const chain = makeChain(
        [{ type: 'fixed1559', maxFeePerGas: '100000000', maxPriorityFeePerGas: '100000' }],
        ['EIP1559'],
      )

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(100000000n)
      expect(result.current[0]?.maxPriorityFeePerGas).toBe(100000n)
    })
  })

  describe('oracle gas price', () => {
    it('should parse an Etherscan oracle result', async () => {
      const chain = makeChain(
        [{ type: 'oracle', uri: 'https://oracle.test', gasParameter: 'FastGasPrice', gweiFactor: '1000000000' }],
        ['EIP1559'],
      )

      mockFetchOk({ data: { FastGasPrice: '47', suggestBaseFee: '44' } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(47000000000n)
      expect(result.current[0]?.maxPriorityFeePerGas).toBe(3000000000n)
    })

    it('should parse a non-Etherscan oracle result', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '200000000' },
      ])

      mockFetchOk({ result: { fast: 300 } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(60000000000n)
    })

    it('should fall back to the next oracle when the first fails', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle1.test', gasParameter: 'fast', gweiFactor: '1000000000' },
        { type: 'oracle', uri: 'https://oracle2.test', gasParameter: 'fast', gweiFactor: '1000000000' },
      ])

      mockFetchReject(new Error('network error'))
      mockFetchOk({ result: { fast: 25 } })

      const logError = jest.fn()
      const { result } = renderHook(() =>
        useDefaultGasPrice(chain, makeProvider(), { isSpeedUp: false, withPooling: false, logError }),
      )

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(logError).toHaveBeenCalledWith('network error')
      expect(result.current[0]?.maxFeePerGas).toBe(25000000000n)
    })

    it('should fall back to a fixed config when all oracles fail', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
        { type: 'fixed', weiValue: '10000000000' },
      ])

      mockFetchReject(new Error('fail'))

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(10000000000n)
    })

    it('should return error when all oracles fail and no fixed fallback', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
      ])

      mockFetchReject(new Error('oracle down'))

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      expect(result.current[1]?.message).toBe('oracle down')
      expect(result.current[0]).toBeUndefined()
    })

    it('should return error when oracle returns non-ok response', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
      ])

      mockFetchNotOk()

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      expect(result.current[1]?.message).toContain('Error fetching gas price from oracle')
    })
  })

  describe('NaN handling in oracle parsing', () => {
    it('should return error when Etherscan FastGasPrice is undefined', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'FastGasPrice', gweiFactor: '1000000000' },
      ])

      mockFetchOk({ data: { FastGasPrice: undefined, suggestBaseFee: '10' } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      expect(result.current[1]?.message).toContain('Invalid Etherscan oracle values')
    })

    it('should return error when Etherscan suggestBaseFee is non-numeric', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'FastGasPrice', gweiFactor: '1000000000' },
      ])

      mockFetchOk({ data: { FastGasPrice: '47', suggestBaseFee: 'not-a-number' } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      expect(result.current[1]?.message).toContain('Invalid Etherscan oracle values')
    })

    it('should return error when non-Etherscan gasParameter is missing', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '200000000' },
      ])

      mockFetchOk({ result: { slow: 10 } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      expect(result.current[1]?.message).toContain('Invalid oracle value')
    })

    it('should handle floating-point precision with Math.round', async () => {
      const chain = makeChain(
        [{ type: 'oracle', uri: 'https://oracle.test', gasParameter: 'FastGasPrice', gweiFactor: '1000000000' }],
        ['EIP1559'],
      )

      mockFetchOk({ data: { FastGasPrice: '22.846685108', suggestBaseFee: '20.123456789' } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[1]).toBeUndefined()
      expect(result.current[0]?.maxFeePerGas).toBe(BigInt(Math.round(22.846685108 * 1e9)))
      expect(result.current[0]?.maxPriorityFeePerGas).toBe(
        BigInt(Math.round(22.846685108 * 1e9)) - BigInt(Math.round(20.123456789 * 1e9)),
      )
    })

    it('should handle floating-point for non-Etherscan oracle', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
      ])

      mockFetchOk({ result: { fast: 25.5 } })

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[1]).toBeUndefined()
      expect(result.current[0]?.maxFeePerGas).toBe(BigInt(Math.round(25.5 * 1e9)))
    })

    it('should fall back to next oracle when NaN oracle fails', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://bad-oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
        { type: 'oracle', uri: 'https://good-oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
      ])

      mockFetchOk({ result: {} })
      mockFetchOk({ result: { fast: 30 } })

      const logError = jest.fn()
      const { result } = renderHook(() =>
        useDefaultGasPrice(chain, makeProvider(), { isSpeedUp: false, withPooling: false, logError }),
      )

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(logError).toHaveBeenCalledWith(expect.stringContaining('Invalid oracle value'))
      expect(result.current[0]?.maxFeePerGas).toBe(30000000000n)
    })
  })

  describe('provider fallback', () => {
    it('should use provider feeData when no gas price configs', async () => {
      const chain = makeChain([], ['EIP1559'])
      mockGetFeeData.mockResolvedValueOnce(
        makeFeeData({ maxFeePerGas: 50000000000n, maxPriorityFeePerGas: 3000000000n }),
      )

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(50000000000n)
      expect(result.current[0]?.maxPriorityFeePerGas).toBe(3000000000n)
    })

    it('should use provider gasPrice for non-EIP1559 chains', async () => {
      const chain = makeChain([])
      mockGetFeeData.mockResolvedValueOnce(makeFeeData({ gasPrice: 15000000000n }))

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(15000000000n)
      expect(result.current[0]?.maxPriorityFeePerGas).toBeUndefined()
    })
  })

  describe('speed up', () => {
    it('should double maxPriorityFeePerGas for EIP-1559 speed up', async () => {
      const chain = makeChain(
        [{ type: 'fixed1559', maxFeePerGas: '30000000000', maxPriorityFeePerGas: '2000000000' }],
        ['EIP1559'],
      )

      const { result } = renderHook(() =>
        useDefaultGasPrice(chain, makeProvider(), { isSpeedUp: true, withPooling: false }),
      )

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxPriorityFeePerGas).toBe(4000000000n)
      expect(result.current[0]?.maxFeePerGas).toBe(32000000000n)
    })

    it('should apply 150% factor for non-EIP1559 speed up', async () => {
      const chain = makeChain([{ type: 'fixed', weiValue: '20000000000' }])

      const { result } = renderHook(() =>
        useDefaultGasPrice(chain, makeProvider(), { isSpeedUp: true, withPooling: false }),
      )

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]?.maxFeePerGas).toBe(30000000000n)
      expect(result.current[0]?.maxPriorityFeePerGas).toBeUndefined()
    })
  })

  describe('loading state', () => {
    it('should be loading initially', () => {
      const chain = makeChain([{ type: 'fixed', weiValue: '1000' }])
      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))
      expect(result.current[2]).toBe(true)
    })

    it('should not be loading after gas price resolves', async () => {
      const chain = makeChain([{ type: 'fixed', weiValue: '1000' }])
      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[2]).toBe(false)
      })

      expect(result.current[0]).toBeDefined()
    })

    it('should not be loading after error', async () => {
      const chain = makeChain([
        { type: 'oracle', uri: 'https://oracle.test', gasParameter: 'fast', gweiFactor: '1000000000' },
      ])

      mockFetchReject(new Error('fail'))

      const { result } = renderHook(() => useDefaultGasPrice(chain, makeProvider()))

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      expect(result.current[2]).toBe(false)
    })
  })
})

describe('getTotalFee', () => {
  it('should multiply maxFeePerGas by gasLimit', () => {
    expect(getTotalFee(10n, 21000n)).toBe(210000n)
  })

  it('should accept string and number gas limits', () => {
    expect(getTotalFee(10n, '21000')).toBe(210000n)
    expect(getTotalFee(10n, 21000)).toBe(210000n)
  })

  it('should handle large values', () => {
    expect(getTotalFee(10000000000000000n, 123123123n)).toBe(1231231230000000000000000n)
  })
})

describe('getTotalFeeFormatted', () => {
  const chain = { nativeCurrency: { decimals: 18 } } as unknown as Chain

  it('should return formatted fee when both params present', () => {
    expect(getTotalFeeFormatted(20000000000n, 21000n, chain)).toBe('0.00042')
  })

  it('should return "> 0.001" when maxFeePerGas is missing', () => {
    expect(getTotalFeeFormatted(undefined, 21000n, chain)).toBe('> 0.001')
    expect(getTotalFeeFormatted(null, 21000n, chain)).toBe('> 0.001')
  })

  it('should return "> 0.001" when gasLimit is missing', () => {
    expect(getTotalFeeFormatted(20000000000n, undefined, chain)).toBe('> 0.001')
  })
})
