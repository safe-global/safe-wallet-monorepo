import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import type { JsonRpcProvider } from 'ethers'
import { useAddressActivity } from '../useAddressActivity'
import { LowActivityAnalysisResult } from '../../config'
import { CommonSharedStatus, Severity } from '../../../../types'
import { ErrorType, getErrorInfo } from '../../../../utils/errors'
import { useMemo } from 'react'

describe('useAddressActivity', () => {
  const mockProvider = (txCount: number) =>
    ({ getTransactionCount: jest.fn().mockResolvedValue(txCount) }) as unknown as JsonRpcProvider

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return empty results when no addresses are provided', async () => {
    const { result } = renderHook(() => {
      const addresses = useMemo(() => [], [])
      const provider = mockProvider(0)
      return useAddressActivity(addresses, provider)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(results).toEqual({})
    expect(error).toBeUndefined()
  })

  it('should return empty results when provider is not provided', async () => {
    const address = faker.finance.ethereumAddress()
    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      return useAddressActivity(addresses)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results).toEqual({})
  })

  it('should return LOW_ACTIVITY assessment with corresponding title and description for address with 0 transactions', async () => {
    const address = faker.finance.ethereumAddress()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      const provider = mockProvider(0)
      return useAddressActivity(addresses, provider)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[address]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results, error] = result.current
    expect(results?.[address]).toEqual(LowActivityAnalysisResult)
    expect(error).toBeUndefined()
  })

  it('should return LOW_ACTIVITY assessment with corresponding title and description for address with less than 5 transactions', async () => {
    const address = faker.finance.ethereumAddress()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      const provider = mockProvider(3)
      return useAddressActivity(addresses, provider)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[address]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results] = result.current
    expect(results?.[address]).toEqual(LowActivityAnalysisResult)
  })

  it('should return no results for HIGH_ACTIVITY addresses', async () => {
    const address = faker.finance.ethereumAddress()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      const provider = mockProvider(250)
      return useAddressActivity(addresses, provider)
    })

    await waitFor(
      () => {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      },
      { timeout: 3000 },
    )

    const [results] = result.current
    expect(results?.[address]).toBeUndefined()
  })

  it('should not return an error when every lookup fails', async () => {
    const [a, b] = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
    const provider = {
      getTransactionCount: jest.fn().mockRejectedValue(new Error('RPC error')),
    } as unknown as JsonRpcProvider

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [a, b], [])
      return useAddressActivity(addresses, provider)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(error).toBeUndefined()
    expect(results?.[a]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
    expect(results?.[b]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Address activity analysis failed for 2 of 2 addresses:',
      expect.any(Error),
    )

    consoleErrorSpy.mockRestore()
  })

  it('should record a FAILED result for failed lookups and keep the other results', async () => {
    const addresses = Array.from({ length: 7 }, () => faker.finance.ethereumAddress())
    const failing = new Set([addresses[1], addresses[5]])
    const provider = {
      getTransactionCount: jest
        .fn()
        .mockImplementation((address: string) =>
          failing.has(address) ? Promise.reject(new Error('RPC error')) : Promise.resolve(0),
        ),
    } as unknown as JsonRpcProvider

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => useAddressActivity(addresses, provider))

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(error).toBeUndefined()
    expect(Object.keys(results ?? {}).sort()).toEqual([...addresses].sort())
    addresses.forEach((address) => {
      expect(results?.[address]).toEqual(
        failing.has(address) ? getErrorInfo(ErrorType.RECIPIENT) : LowActivityAnalysisResult,
      )
    })
    expect(results?.[addresses[1]]).toMatchObject({ type: CommonSharedStatus.FAILED, severity: Severity.WARN })
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Address activity analysis failed for 2 of 7 addresses:',
      expect.any(Error),
    )

    consoleErrorSpy.mockRestore()
  })

  it('should not return an error when a newly added address is the only one that fails', async () => {
    const [a, b] = [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()]
    const provider = {
      getTransactionCount: jest
        .fn()
        .mockImplementation((address: string) =>
          address === b ? Promise.reject(new Error('RPC error')) : Promise.resolve(0),
        ),
    } as unknown as JsonRpcProvider
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result, rerender } = renderHook(({ addrs }) => useAddressActivity(addrs, provider), {
      initialProps: { addrs: [a] },
    })

    await waitFor(() => {
      const [results] = result.current
      expect(results?.[a]).toEqual(LowActivityAnalysisResult)
    })

    rerender({ addrs: [a, b] })

    await waitFor(() => {
      const [results] = result.current
      expect(results?.[b]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
    })

    const [results, error, loading] = result.current
    expect(error).toBeUndefined()
    expect(loading).toBe(false)
    expect(results?.[a]).toEqual(LowActivityAnalysisResult)

    consoleErrorSpy.mockRestore()
  })

  it('should finish loading when an address is added after every lookup failed', async () => {
    const [a, b, c] = [
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
      faker.finance.ethereumAddress(),
    ]
    const provider = {
      getTransactionCount: jest
        .fn()
        .mockImplementation((address: string) =>
          address === c ? Promise.resolve(0) : Promise.reject(new Error('RPC error')),
        ),
    } as unknown as JsonRpcProvider
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result, rerender } = renderHook(({ addrs }) => useAddressActivity(addrs, provider), {
      initialProps: { addrs: [a, b] },
    })

    await waitFor(() => {
      const [results] = result.current
      expect(results?.[a]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
      expect(results?.[b]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
    })

    rerender({ addrs: [a, b, c] })

    await waitFor(() => {
      const [results, , loading] = result.current
      expect(results?.[c]).toEqual(LowActivityAnalysisResult)
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(error).toBeUndefined()
    expect(results?.[a]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
    expect(results?.[b]).toEqual(getErrorInfo(ErrorType.RECIPIENT))

    consoleErrorSpy.mockRestore()
  })

  it('should handle multiple addresses, only returning results for low activity', async () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const mockGetTransactionCount = jest.fn().mockImplementation((addr) => {
      if (addr === address1) return Promise.resolve(3)
      if (addr === address2) return Promise.resolve(100)
      return Promise.resolve(0)
    })

    const provider = { getTransactionCount: mockGetTransactionCount } as unknown as JsonRpcProvider

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address1, address2], [])
      return useAddressActivity(addresses, provider)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[address1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results] = result.current
    expect(results?.[address1]?.type).toBe('LOW_ACTIVITY')
    expect(results?.[address1]?.severity).toBe('WARN')

    // High activity address should not have a result
    expect(results?.[address2]).toBeUndefined()

    expect(mockGetTransactionCount).toHaveBeenCalledTimes(2)
  })

  it('should re-fetch when addresses change', async () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const mockGetTransactionCount = jest.fn().mockImplementation((addr) => {
      if (addr === address1) return Promise.resolve(3)
      if (addr === address2) return Promise.resolve(2)
      return Promise.resolve(0)
    })

    const provider = { getTransactionCount: mockGetTransactionCount } as unknown as JsonRpcProvider

    const { result, rerender } = renderHook(
      ({ addrs }) => {
        const addresses = useMemo(() => addrs, [addrs])
        return useAddressActivity(addresses, provider)
      },
      { initialProps: { addrs: [address1] } },
    )

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[address1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results1] = result.current
    expect(results1?.[address1]?.type).toBe('LOW_ACTIVITY')

    rerender({ addrs: [address2] })

    await waitFor(
      () => {
        const [results2] = result.current
        expect(results2?.[address2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results2] = result.current
    expect(results2?.[address2]?.type).toBe('LOW_ACTIVITY')
    // Old address should not be in results anymore
    expect(results2?.[address1]).toBeUndefined()
  })

  describe('large recipient sets', () => {
    const createAddresses = (count: number) => Array.from({ length: count }, () => faker.finance.ethereumAddress())

    it('should not look up any address when there are more than 50', async () => {
      const addresses = createAddresses(51)
      const getTransactionCount = jest.fn().mockResolvedValue(0)
      const provider = { getTransactionCount } as unknown as JsonRpcProvider

      const { result } = renderHook(() => useAddressActivity(addresses, provider))

      await waitFor(() => {
        const [results, , loading] = result.current
        expect(results).toBeDefined()
        expect(loading).toBe(false)
      })

      const [results, error] = result.current
      expect(getTransactionCount).not.toHaveBeenCalled()
      expect(error).toBeUndefined()
      expect(Object.keys(results ?? {}).sort()).toEqual([...addresses].sort())
      expect(Object.values(results ?? {}).every((entry) => entry === undefined)).toBe(true)
    })

    it('should look up all 50 addresses with at most 5 lookups in flight', async () => {
      const addresses = createAddresses(50)
      let inFlight = 0
      let maxInFlight = 0
      const getTransactionCount = jest.fn().mockImplementation(async () => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await Promise.resolve()
        inFlight--
        return 0
      })
      const provider = { getTransactionCount } as unknown as JsonRpcProvider

      const { result } = renderHook(() => useAddressActivity(addresses, provider))

      await waitFor(() => {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      })

      const [results, error] = result.current
      expect(error).toBeUndefined()
      expect(getTransactionCount).toHaveBeenCalledTimes(50)
      expect(maxInFlight).toBeLessThanOrEqual(5)
      expect(Object.keys(results ?? {})).toHaveLength(50)
    })

    it('should drop a failed result when the recipient set grows beyond the cap', async () => {
      const address = faker.finance.ethereumAddress()
      const getTransactionCount = jest.fn().mockRejectedValue(new Error('RPC error'))
      const provider = { getTransactionCount } as unknown as JsonRpcProvider
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const oversized = [address, ...createAddresses(50)]

      const { result, rerender } = renderHook(({ addrs }) => useAddressActivity(addrs, provider), {
        initialProps: { addrs: [address] },
      })

      await waitFor(() => {
        const [results] = result.current
        expect(results?.[address]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
      })

      rerender({ addrs: oversized })

      await waitFor(() => {
        const [results, , loading] = result.current
        expect(Object.keys(results ?? {})).toHaveLength(51)
        expect(loading).toBe(false)
      })

      const [results, error] = result.current
      expect(error).toBeUndefined()
      expect(results?.[address]).toBeUndefined()
      expect(getTransactionCount).toHaveBeenCalledTimes(1)

      consoleErrorSpy.mockRestore()
    })

    it('should not resurrect a failed result when the set is emptied and then exceeds the cap', async () => {
      const address = faker.finance.ethereumAddress()
      const provider = {
        getTransactionCount: jest.fn().mockRejectedValue(new Error('RPC error')),
      } as unknown as JsonRpcProvider
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const oversized = [address, ...createAddresses(50)]

      const { result, rerender } = renderHook(({ addrs }) => useAddressActivity(addrs, provider), {
        initialProps: { addrs: [address] },
      })

      await waitFor(() => {
        const [results] = result.current
        expect(results?.[address]).toEqual(getErrorInfo(ErrorType.RECIPIENT))
      })

      rerender({ addrs: [] })
      rerender({ addrs: oversized })

      await waitFor(() => {
        const [results, , loading] = result.current
        expect(Object.keys(results ?? {})).toHaveLength(51)
        expect(loading).toBe(false)
      })

      const [results, error] = result.current
      expect(error).toBeUndefined()
      expect(Object.values(results ?? {}).every((entry) => entry === undefined)).toBe(true)

      consoleErrorSpy.mockRestore()
    })
  })
})
