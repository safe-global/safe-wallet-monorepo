import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetchRecipientAnalysis } from '../useFetchRecipientAnalysis'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeAddressHook from '@/hooks/useSafeAddress'
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
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(mockChainId)
    jest.spyOn(useSafeAddressHook, 'default').mockReturnValue(mockSafeAddress)

    useFetchMultiRecipientAnalysisSpy = jest
      .spyOn(useFetchMultiRecipientAnalysisModule, 'useFetchMultiRecipientAnalysis')
      .mockReturnValue([{}, undefined, false])
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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith(mockSafeAddress, mockChainId, [])
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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith('', mockChainId, [mockRecipient1])
  })

  it('should fetch recipient analysis for a single recipient', async () => {
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])

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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith(mockSafeAddress, mockChainId, [mockRecipient1])
  })

  it('should fetch recipient analysis for multiple recipients', async () => {
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([
      { [mockRecipient1]: mockAnalysisResult, [mockRecipient2]: mockAnalysisResult },
      undefined,
      false,
    ])

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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith(mockSafeAddress, mockChainId, [
      mockRecipient1,
      mockRecipient2,
    ])
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

    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith(mockSafeAddress, mockChainId, [mockRecipient1])

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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenLastCalledWith(mockSafeAddress, mockChainId, [mockRecipient2])
  })

  it('should clear cache and re-fetch when chainId changes', async () => {
    const useChainIdSpy = jest.spyOn(useChainIdHook, 'default').mockReturnValue('1')

    useFetchMultiRecipientAnalysisSpy
      .mockReturnValueOnce([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])
      .mockReturnValueOnce([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])

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

    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith(mockSafeAddress, '1', [mockRecipient1])

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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenLastCalledWith(mockSafeAddress, '137', [mockRecipient1])
  })

  it('should clear cache and re-fetch when safeAddress changes', async () => {
    const newSafeAddress = faker.finance.ethereumAddress()
    const useSafeAddressSpy = jest.spyOn(useSafeAddressHook, 'default').mockReturnValue(mockSafeAddress)

    useFetchMultiRecipientAnalysisSpy
      .mockReturnValueOnce([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])
      .mockReturnValueOnce([{ [mockRecipient1]: mockAnalysisResult }, undefined, false])

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

    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenCalledWith(mockSafeAddress, mockChainId, [mockRecipient1])

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
    expect(useFetchMultiRecipientAnalysisSpy).toHaveBeenLastCalledWith(newSafeAddress, mockChainId, [mockRecipient1])
  })

  it('should handle fetch errors gracefully', async () => {
    const errorMessage = 'Network error'
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([undefined, new Error(errorMessage), false])

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
    expect(error?.message).toBe(errorMessage)
  })

  it('should handle loading state', async () => {
    useFetchMultiRecipientAnalysisSpy.mockReturnValue([undefined, undefined, true])

    const { result } = renderHook(() => {
      const recipients = useMemo(() => [mockRecipient1], [])
      return useFetchRecipientAnalysis(recipients)
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
