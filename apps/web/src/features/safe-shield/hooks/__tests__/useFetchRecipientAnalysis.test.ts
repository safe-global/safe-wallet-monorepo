import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchRecipientAnalysis } from '../useFetchRecipientAnalysis'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeAddressHook from '@/hooks/useSafeAddress'
import { useMemo } from 'react'

describe('useFetchRecipientAnalysis', () => {
  const mockChainId = '1'
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockRecipient1 = faker.finance.ethereumAddress()
  const mockRecipient2 = faker.finance.ethereumAddress()

  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(mockChainId)
    jest.spyOn(useSafeAddressHook, 'default').mockReturnValue(mockSafeAddress)

    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          RECIPIENT_INTERACTION: [
            { type: 'NEW_RECIPIENT', severity: 'INFO', title: 'New Recipient', description: 'First interaction' },
          ],
        }),
      } as Response)
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('should return empty results when no recipients are provided', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(results).toEqual({})
    expect(error).toBeUndefined()
  })

  it('should return empty results when safeAddress is not available', async () => {
    jest.spyOn(useSafeAddressHook, 'default').mockReturnValue('')

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results).toEqual({})
  })

  it('should fetch recipient analysis for a single recipient', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results, error] = result.current
    expect(results?.[mockRecipient1]).toBeDefined()
    expect(error).toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledWith(
      `http://localhost:3000/v1/chains/${mockChainId}/security/${mockSafeAddress}/recipient/${mockRecipient1}`,
    )
  })

  it('should fetch recipient analysis for multiple recipients', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1, mockRecipient2], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
        expect(results?.[mockRecipient2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results] = result.current
    expect(results?.[mockRecipient1]).toBeDefined()
    expect(results?.[mockRecipient2]).toBeDefined()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('should only fetch new recipients when recipients list changes', async () => {
    const { result, rerender } = renderHook(
      ({ recipients }) => {
        const memoizedRecipients = useMemo(() => recipients, [recipients])
        return useFetchRecipientAnalysis(memoizedRecipients)
      },
      { initialProps: { recipients: [mockRecipient1] } },
    )

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Add a second recipient
    rerender({ recipients: [mockRecipient1, mockRecipient2] })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Should only fetch the new recipient
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('should clear cache and re-fetch when chainId changes', async () => {
    const useChainIdSpy = jest.spyOn(useChainIdHook, 'default').mockReturnValue('1')

    const { result, rerender } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      `http://localhost:3000/v1/chains/1/security/${mockSafeAddress}/recipient/${mockRecipient1}`,
    )

    // Change chainId
    useChainIdSpy.mockReturnValue('137')
    rerender()

    await waitFor(
      () => {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      },
      { timeout: 3000 },
    )

    // Should fetch again with new chainId
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith(
      `http://localhost:3000/v1/chains/137/security/${mockSafeAddress}/recipient/${mockRecipient1}`,
    )
  })

  it('should clear cache and re-fetch when safeAddress changes', async () => {
    const newSafeAddress = faker.finance.ethereumAddress()
    const useSafeAddressSpy = jest.spyOn(useSafeAddressHook, 'default').mockReturnValue(mockSafeAddress)

    const { result, rerender } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      `http://localhost:3000/v1/chains/${mockChainId}/security/${mockSafeAddress}/recipient/${mockRecipient1}`,
    )

    // Change safeAddress
    useSafeAddressSpy.mockReturnValue(newSafeAddress)
    rerender()

    await waitFor(
      () => {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      },
      { timeout: 3000 },
    )

    // Should fetch again with new safeAddress
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith(
      `http://localhost:3000/v1/chains/${mockChainId}/security/${newSafeAddress}/recipient/${mockRecipient1}`,
    )
  })

  it('should handle fetch errors gracefully', async () => {
    const errorMessage = 'Network error'
    fetchSpy.mockRejectedValueOnce(new Error(errorMessage))

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error).toBeInstanceOf(Error)
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('should handle 422 status code', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 422, statusText: 'Unprocessable Entity' } as Response)

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error?.message).toBe('Invalid Safe or recipient address')

    consoleErrorSpy.mockRestore()
  })

  it('should handle 503 status code', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' } as Response)

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error?.message).toBe('Service unavailable')

    consoleErrorSpy.mockRestore()
  })
})
