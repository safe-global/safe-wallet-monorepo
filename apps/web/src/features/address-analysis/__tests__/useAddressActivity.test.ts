import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import type { JsonRpcProvider } from 'ethers'
import { useAddressActivity } from '../useAddressActivity'
import * as web3 from '@/hooks/wallets/web3'
import * as useChainIdHook from '@/hooks/useChainId'
import { ActivityMessages } from '../config'

describe('useAddressActivity', () => {
  const mockProvider = (txCount: number) =>
    ({
      getTransactionCount: jest.fn().mockResolvedValue(txCount),
    }) as unknown as JsonRpcProvider

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainIdHook, 'default').mockReturnValue('1')
  })

  it('should return undefined when address is not provided', async () => {
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider(0))

    const { result } = renderHook(() => useAddressActivity(undefined))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toBeUndefined()
    expect(result.current.title).toBeUndefined()
    expect(result.current.description).toBeUndefined()
  })

  it('should return undefined when provider is not available', async () => {
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(undefined as unknown as JsonRpcProvider)

    const address = faker.finance.ethereumAddress()
    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toBeUndefined()
  })

  it('should return NO_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider(0))

    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toEqual({
      txCount: 0,
      activityLevel: 'NO_ACTIVITY',
    })
    expect(result.current.title).toBe(ActivityMessages.NO_ACTIVITY.title)
    expect(result.current.description).toBe(ActivityMessages.NO_ACTIVITY.description)
    expect(result.current.error).toBeUndefined()
  })

  it('should return VERY_LOW_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider(3))

    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toEqual({
      txCount: 3,
      activityLevel: 'VERY_LOW_ACTIVITY',
    })
    expect(result.current.title).toBe(ActivityMessages.VERY_LOW_ACTIVITY.title)
    expect(result.current.description).toBe(ActivityMessages.VERY_LOW_ACTIVITY.description)
  })

  it('should return LOW_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider(10))

    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toEqual({
      txCount: 10,
      activityLevel: 'LOW_ACTIVITY',
    })
    expect(result.current.title).toBe(ActivityMessages.LOW_ACTIVITY.title)
    expect(result.current.description).toBe(ActivityMessages.LOW_ACTIVITY.description)
  })

  it('should return MODERATE_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider(50))

    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toEqual({
      txCount: 50,
      activityLevel: 'MODERATE_ACTIVITY',
    })
    expect(result.current.title).toBe(ActivityMessages.MODERATE_ACTIVITY.title)
    expect(result.current.description).toBe(ActivityMessages.MODERATE_ACTIVITY.description)
  })

  it('should return HIGH_ACTIVITY assessment with corresponding title and description', async () => {
    const address = faker.finance.ethereumAddress()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider(250))

    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toEqual({
      txCount: 250,
      activityLevel: 'HIGH_ACTIVITY',
    })
    expect(result.current.title).toBe(ActivityMessages.HIGH_ACTIVITY.title)
    expect(result.current.description).toBe(ActivityMessages.HIGH_ACTIVITY.description)
  })

  it('should handle errors gracefully', async () => {
    const address = faker.finance.ethereumAddress()
    const errorMessage = 'RPC error'
    const provider = {
      getTransactionCount: jest.fn().mockRejectedValue(new Error(errorMessage)),
    } as unknown as JsonRpcProvider

    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(provider)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment).toBeUndefined()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toContain('Failed to analyze address activity')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Address activity analysis error:', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it('should re-fetch when address changes', async () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()
    const mockGetTransactionCount = jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(100)
    const provider = {
      getTransactionCount: mockGetTransactionCount,
    } as unknown as JsonRpcProvider

    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(provider)

    const { result, rerender } = renderHook(({ addr }) => useAddressActivity(addr), {
      initialProps: { addr: address1 },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment?.txCount).toBe(5)
    expect(result.current.assessment?.activityLevel).toBe('LOW_ACTIVITY')

    rerender({ addr: address2 })

    await waitFor(() => {
      expect(result.current.assessment?.txCount).toBe(100)
    })

    expect(result.current.assessment?.activityLevel).toBe('HIGH_ACTIVITY')
    expect(mockGetTransactionCount).toHaveBeenCalledTimes(2)
  })

  it('should re-fetch when chainId changes', async () => {
    const address = faker.finance.ethereumAddress()
    const mockGetTransactionCount = jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(50)
    const provider = {
      getTransactionCount: mockGetTransactionCount,
    } as unknown as JsonRpcProvider

    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(provider)
    const useChainIdSpy = jest.spyOn(useChainIdHook, 'default').mockReturnValue('1')

    const { result, rerender } = renderHook(() => useAddressActivity(address))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assessment?.txCount).toBe(10)

    useChainIdSpy.mockReturnValue('137')
    rerender()

    await waitFor(() => {
      expect(result.current.assessment?.txCount).toBe(50)
    })

    expect(mockGetTransactionCount).toHaveBeenCalledTimes(2)
  })
})
