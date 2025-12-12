import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import type { JsonRpcProvider } from 'ethers'
import { useAddressActivity } from '../useAddressActivity'
import { LowActivityAnalysisResult } from '../../config'
import { useMemo } from 'react'

describe('useAddressActivity', () => {
  const mockProvider = (txCount: number) =>
    ({ getTransactionCount: jest.fn().mockResolvedValue(txCount) } as unknown as JsonRpcProvider)

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

  it('should handle errors gracefully and not include failed addresses', async () => {
    const address = faker.finance.ethereumAddress()
    const errorMessage = 'RPC error'
    const provider = {
      getTransactionCount: jest.fn().mockRejectedValue(new Error(errorMessage)),
    } as unknown as JsonRpcProvider

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      return useAddressActivity(addresses, provider)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results?.[address]).toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalledWith(`Address activity analysis error for ${address}:`, expect.any(Error))

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
})
