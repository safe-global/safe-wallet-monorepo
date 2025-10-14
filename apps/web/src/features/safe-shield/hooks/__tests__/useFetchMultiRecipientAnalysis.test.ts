import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchMultiRecipientAnalysis } from '../useFetchMultiRecipientAnalysis'
import * as safeShieldModule from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { useMemo } from 'react'

describe('useFetchMultiRecipientAnalysis', () => {
  const mockChainId = '1'
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockRecipient1 = faker.finance.ethereumAddress()
  const mockRecipient2 = faker.finance.ethereumAddress()

  let fetchRecipientAnalysisMock: jest.Mock

  beforeEach(() => {
    jest.resetAllMocks()

    fetchRecipientAnalysisMock = jest.fn().mockResolvedValue({
      data: {
        RECIPIENT_INTERACTION: [
          { type: 'NEW_RECIPIENT', severity: 'INFO', title: 'New Recipient', description: 'First interaction' },
        ],
      },
      isError: false,
    })

    jest.spyOn(safeShieldModule, 'useLazySafeShieldAnalyzeRecipientV1Query').mockReturnValue([
      fetchRecipientAnalysisMock,
      {
        data: undefined,
        error: undefined,
        isLoading: false,
        isFetching: false,
        isSuccess: false,
        isError: false,
        isUninitialized: true,
        status: 'uninitialized',
        endpointName: 'safeShieldAnalyzeRecipientV1',
        requestId: '',
        originalArgs: undefined,
        fulfilledTimeStamp: undefined,
        startedTimeStamp: undefined,
        refetch: jest.fn(),
        reset: jest.fn(),
      },
      { lastArg: { chainId: mockChainId, safeAddress: mockSafeAddress, recipientAddress: mockRecipient1 } },
    ])
  })

  it('should return empty results when no recipients are provided', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [], [])
      return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(results).toBeUndefined()
    expect(error).toBeUndefined()
    expect(fetchRecipientAnalysisMock).not.toHaveBeenCalled()
  })

  it('should return empty results when safeAddress is not available', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchMultiRecipientAnalysis('', mockChainId, recipients)
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results).toBeUndefined()
    expect(fetchRecipientAnalysisMock).not.toHaveBeenCalled()
  })

  it('should fetch analysis for a single recipient', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, recipients)
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
    expect(fetchRecipientAnalysisMock).toHaveBeenCalledWith({
      chainId: mockChainId,
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient1,
    })
  })

  it('should fetch analysis for multiple recipients', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1, mockRecipient2], [])
      return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, recipients)
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
    expect(fetchRecipientAnalysisMock).toHaveBeenCalledTimes(2)
    expect(fetchRecipientAnalysisMock).toHaveBeenCalledWith({
      chainId: mockChainId,
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient1,
    })
    expect(fetchRecipientAnalysisMock).toHaveBeenCalledWith({
      chainId: mockChainId,
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient2,
    })
  })

  it('should handle fetch errors gracefully', async () => {
    fetchRecipientAnalysisMock.mockResolvedValueOnce({ data: undefined, isError: true, status: 'FETCH_ERROR' })

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, recipients)
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toContain('Failed to fetch recipient analysis')
  })

  it('should handle missing data error', async () => {
    fetchRecipientAnalysisMock.mockResolvedValueOnce({ data: undefined, isError: false })

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, recipients)
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toContain('No data returned')
  })

  it('should re-fetch when recipients list changes', async () => {
    const { result, rerender } = renderHook(
      ({ recipients }) => {
        const memoizedRecipients = useMemo(() => recipients, [recipients])
        return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, memoizedRecipients)
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

    expect(fetchRecipientAnalysisMock).toHaveBeenCalledTimes(1)

    // Change recipients list
    rerender({ recipients: [mockRecipient2] })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    expect(fetchRecipientAnalysisMock).toHaveBeenCalledTimes(2)
    expect(fetchRecipientAnalysisMock).toHaveBeenLastCalledWith({
      chainId: mockChainId,
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient2,
    })
  })

  it('should re-fetch when chainId changes', async () => {
    const { result, rerender } = renderHook(
      ({ chainId }) => {
        const recipients = useMemo(() => [mockRecipient1], [])
        return useFetchMultiRecipientAnalysis(mockSafeAddress, chainId, recipients)
      },
      { initialProps: { chainId: '1' } },
    )

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    expect(fetchRecipientAnalysisMock).toHaveBeenCalledWith({
      chainId: '1',
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient1,
    })

    // Change chainId
    rerender({ chainId: '137' })

    await waitFor(
      () => {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      },
      { timeout: 3000 },
    )

    expect(fetchRecipientAnalysisMock).toHaveBeenCalledTimes(2)
    expect(fetchRecipientAnalysisMock).toHaveBeenLastCalledWith({
      chainId: '137',
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient1,
    })
  })

  it('should re-fetch when safeAddress changes', async () => {
    const newSafeAddress = faker.finance.ethereumAddress()

    const { result, rerender } = renderHook(
      ({ safeAddress }) => {
        const recipients = useMemo(() => [mockRecipient1], [])
        return useFetchMultiRecipientAnalysis(safeAddress, mockChainId, recipients)
      },
      { initialProps: { safeAddress: mockSafeAddress } },
    )

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
      },
      { timeout: 3000 },
    )

    expect(fetchRecipientAnalysisMock).toHaveBeenCalledWith({
      chainId: mockChainId,
      safeAddress: mockSafeAddress,
      recipientAddress: mockRecipient1,
    })

    // Change safeAddress
    rerender({ safeAddress: newSafeAddress })

    await waitFor(
      () => {
        const [, , loading] = result.current
        expect(loading).toBe(false)
      },
      { timeout: 3000 },
    )

    expect(fetchRecipientAnalysisMock).toHaveBeenCalledTimes(2)
    expect(fetchRecipientAnalysisMock).toHaveBeenLastCalledWith({
      chainId: mockChainId,
      safeAddress: newSafeAddress,
      recipientAddress: mockRecipient1,
    })
  })

  it('should handle partial failures in multiple fetches', async () => {
    fetchRecipientAnalysisMock
      .mockResolvedValueOnce({
        data: {
          RECIPIENT_INTERACTION: [
            { type: 'NEW_RECIPIENT', severity: 'INFO', title: 'New Recipient', description: 'First interaction' },
          ],
        },
        isError: false,
      })
      .mockResolvedValueOnce({ data: undefined, isError: true, status: 'FETCH_ERROR' })

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1, mockRecipient2], [])
      return useFetchMultiRecipientAnalysis(mockSafeAddress, mockChainId, recipients)
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toContain('Failed to fetch recipient analysis')
  })
})
