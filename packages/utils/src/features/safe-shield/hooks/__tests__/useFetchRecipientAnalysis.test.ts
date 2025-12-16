import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchRecipientAnalysis } from '../useFetchRecipientAnalysis'
import * as useFetchMultiRecipientAnalysisModule from '../useFetchMultiRecipientAnalysis'
import { useMemo } from 'react'

describe('useFetchRecipientAnalysis', () => {
  const mockChainId = '1'
  const mockSafeAddress = faker.finance.ethereumAddress()
  const mockRecipient1 = faker.finance.ethereumAddress()
  const mockRecipient2 = faker.finance.ethereumAddress()

  const mockAnalysisResult = {
    RECIPIENT_INTERACTION: [
      { type: 'NEW_RECIPIENT', severity: 'INFO', title: 'New Recipient', description: 'First interaction' },
    ],
  }

  let useFetchMultiRecipientAnalysisSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetAllMocks()

    useFetchMultiRecipientAnalysisSpy = jest
      .spyOn(useFetchMultiRecipientAnalysisModule, 'useFetchMultiRecipientAnalysis')
      .mockReturnValue([{}, undefined, false])
  })

  it('should return empty results when no recipients are provided', async () => {
    const { result } = renderHook(() => {
      const recipients = useMemo(() => [], [])
      return useFetchRecipientAnalysis({ safeAddress: mockSafeAddress, chainId: mockChainId, recipients })
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results, error] = result.current
    expect(results).toBeUndefined()
    expect(error).toBeUndefined()
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipientAddresses: [],
    })
  })

  it('should return empty results when safeAddress is not available', async () => {
    // When safeAddress is empty, useFetchMultiRecipientAnalysis returns undefined
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis({ safeAddress: '', chainId: mockChainId, recipients })
    })

    await waitFor(() => {
      const [, , loading] = result.current
      expect(loading).toBe(false)
    })

    const [results] = result.current
    expect(results).toBeUndefined()
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith({
      safeAddress: '',
      chainId: mockChainId,
      recipientAddresses: [mockRecipient1],
    })
  })

  it('should fetch recipient analysis for a single recipient', async () => {
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis({ safeAddress: mockSafeAddress, chainId: mockChainId, recipients })
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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipientAddresses: [mockRecipient1],
    })
  })

  it('should fetch recipient analysis for multiple recipients', async () => {
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([
      { [mockRecipient1]: mockAnalysisResult, [mockRecipient2]: mockAnalysisResult },
      undefined,
      false,
    ])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1, mockRecipient2], [])
      return useFetchRecipientAnalysis({ safeAddress: mockSafeAddress, chainId: mockChainId, recipients })
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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipientAddresses: [mockRecipient1, mockRecipient2],
    })
  })

  it('should only fetch new recipients when recipients list changes', async () => {
    let callCount = 0
    useFetchMultiRecipientAnalysisSpy.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return [{ [mockRecipient1]: mockAnalysisResult }, undefined, false]
      }
      return [{ [mockRecipient2]: mockAnalysisResult }, undefined, false]
    })

    const { result, rerender } = renderHook(
      ({ recipients }) => {
        const memoizedRecipients = useMemo(() => recipients, [recipients])
        return useFetchRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients: memoizedRecipients,
        })
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

    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipientAddresses: [mockRecipient1],
    })

    // Add a second recipient
    rerender({ recipients: [mockRecipient1, mockRecipient2] })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    // Should only fetch the new recipient (not mockRecipient1 again)
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenLastCalledWith({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      recipientAddresses: [mockRecipient2],
    })
  })

  it('should clear cache and re-fetch when chainId changes', async () => {
    useFetchMultiRecipientAnalysisSpy
      .mockReturnValueOnce([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])
      .mockReturnValueOnce([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])

    const { result, rerender } = renderHook(
      ({ chainId }) => {
        const recipients = useMemo(() => [mockRecipient1], [])
        return useFetchRecipientAnalysis({ safeAddress: mockSafeAddress, chainId, recipients })
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

    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith({
      safeAddress: mockSafeAddress,
      chainId: '1',
      recipientAddresses: [mockRecipient1],
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

    // Should fetch again with new chainId
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenLastCalledWith({
      safeAddress: mockSafeAddress,
      chainId: '137',
      recipientAddresses: [mockRecipient1],
    })
  })

  it('should handle fetch errors gracefully', async () => {
    const errorMessage = 'Network error'
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([undefined, new Error(errorMessage), false])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis({ safeAddress: mockSafeAddress, chainId: mockChainId, recipients })
    })

    await waitFor(() => {
      const [, error] = result.current
      expect(error).toBeDefined()
    })

    const [, error] = result.current
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toBe(errorMessage)
  })

  it('should handle loading state', async () => {
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([undefined, undefined, true])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis({ safeAddress: mockSafeAddress, chainId: mockChainId, recipients })
    })

    const [, , loading] = result.current
    expect(loading).toBe(true)
  })

  it('should merge fetched results with cached results', async () => {
    let callCount = 0
    useFetchMultiRecipientAnalysisSpy.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return [{ [mockRecipient1]: mockAnalysisResult }, undefined, false]
      }
      return [{ [mockRecipient2]: mockAnalysisResult }, undefined, false]
    })

    const { result, rerender } = renderHook(
      ({ recipients }) => {
        const memoizedRecipients = useMemo(() => recipients, [recipients])
        return useFetchRecipientAnalysis({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          recipients: memoizedRecipients,
        })
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

    // Add second recipient
    rerender({ recipients: [mockRecipient1, mockRecipient2] })

    await waitFor(
      () => {
        const [results] = result.current
        expect(results?.[mockRecipient1]).toBeDefined()
        expect(results?.[mockRecipient2]).toBeDefined()
      },
      { timeout: 3000 },
    )

    const [results] = result.current
    expect(results?.[mockRecipient1]).toEqual(mockAnalysisResult)
    expect(results?.[mockRecipient2]).toEqual(mockAnalysisResult)
  })
})
