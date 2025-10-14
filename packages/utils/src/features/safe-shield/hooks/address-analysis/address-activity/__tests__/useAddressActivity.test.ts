import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import type { JsonRpcProvider } from 'ethers'
import { useAddressActivity } from '../useAddressActivity'
import { ActivityMessages } from '../../config'
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

  it('should return NO_ACTIVITY assessment with corresponding title and description', async () => {
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
    expect(results?.[address]).toEqual({
      type: 'LOW_ACTIVITY',
      severity: 'WARN',
      title: ActivityMessages.NO_ACTIVITY.title,
      description: ActivityMessages.NO_ACTIVITY.description,
    })
    expect(error).toBeUndefined()
  })

  it('should return VERY_LOW_ACTIVITY assessment with corresponding title and description', async () => {
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
    expect(results?.[address]).toEqual({
      type: 'LOW_ACTIVITY',
      severity: 'WARN',
      title: ActivityMessages.VERY_LOW_ACTIVITY.title,
      description: ActivityMessages.VERY_LOW_ACTIVITY.description,
    })
  })

  it('should return LOW_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      const provider = mockProvider(10)
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
    expect(results?.[address]).toEqual({
      type: 'LOW_ACTIVITY',
      severity: 'WARN',
      title: ActivityMessages.LOW_ACTIVITY.title,
      description: ActivityMessages.LOW_ACTIVITY.description,
    })
  })

  it('should return MODERATE_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      const provider = mockProvider(50)
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
    expect(results?.[address]).toEqual({
      type: 'HIGH_ACTIVITY',
      severity: 'OK',
      title: ActivityMessages.MODERATE_ACTIVITY.title,
      description: ActivityMessages.MODERATE_ACTIVITY.description,
    })
  })

  it('should return HIGH_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address], [])
      const provider = mockProvider(250)
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
    expect(results?.[address]).toEqual({
      type: 'HIGH_ACTIVITY',
      severity: 'OK',
      title: ActivityMessages.HIGH_ACTIVITY.title,
      description: ActivityMessages.HIGH_ACTIVITY.description,
    })
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

  it('should handle multiple addresses', async () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const mockGetTransactionCount = jest.fn().mockImplementation((addr) => {
      if (addr === address1) return Promise.resolve(5)
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
        expect(results?.[address2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results] = result.current
    expect(results?.[address1]?.type).toBe('LOW_ACTIVITY')
    expect(results?.[address1]?.severity).toBe('WARN')

    expect(results?.[address2]?.type).toBe('HIGH_ACTIVITY')
    expect(results?.[address2]?.severity).toBe('OK')

    expect(mockGetTransactionCount).toHaveBeenCalledTimes(2)
  })

  it('should re-fetch when addresses change', async () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const mockGetTransactionCount = jest.fn().mockImplementation((addr) => {
      if (addr === address1) return Promise.resolve(5)
      if (addr === address2) return Promise.resolve(100)
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
  })

  it('should clear cache and re-fetch when provider changes', async () => {
    const address = faker.finance.ethereumAddress()
    const provider1 = mockProvider(5)
    const provider2 = mockProvider(100)

    const { result, rerender } = renderHook(
      ({ prov }) => {
        const addresses = useMemo(() => [address], [])
        return useAddressActivity(addresses, prov)
      },
      { initialProps: { prov: provider1 } },
    )

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[address]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results1] = result.current
    expect(results1?.[address]?.type).toBe('LOW_ACTIVITY')
    expect(provider1.getTransactionCount).toHaveBeenCalledTimes(1)

    // Change provider
    rerender({ prov: provider2 })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[address]?.type).toBe('HIGH_ACTIVITY')
      },
      { timeout: 3000 },
    )

    const [results2] = result.current
    expect(results2?.[address]?.type).toBe('HIGH_ACTIVITY')
    expect(provider2.getTransactionCount).toHaveBeenCalledTimes(1)
  })
})
