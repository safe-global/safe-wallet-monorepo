import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useThreatAnalysisHypernativeBatch } from '../useThreatAnalysisHypernativeBatch'
import type {
  HypernativeBatchAssessmentResponseItemDto,
  HypernativeBatchAssessmentErrorDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { StatusGroup } from '@safe-global/utils/features/safe-shield/types'

jest.mock('@safe-global/store/hypernative/hypernativeApi', () => ({
  hypernativeApi: {
    useGetBatchAssessmentsMutation: jest.fn(),
  },
}))

jest.mock('@safe-global/utils/features/safe-shield/utils/buildHypernativeBatchRequestData', () => ({
  buildHypernativeBatchRequestData: jest.fn(),
}))

jest.mock('@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse', () => ({
  mapHypernativeResponse: jest.fn(),
}))

const mockUseGetBatchAssessmentsMutation = hypernativeApi.useGetBatchAssessmentsMutation as jest.MockedFunction<
  typeof hypernativeApi.useGetBatchAssessmentsMutation
>

import { buildHypernativeBatchRequestData } from '@safe-global/utils/features/safe-shield/utils/buildHypernativeBatchRequestData'
import { mapHypernativeResponse } from '@safe-global/utils/features/safe-shield/utils/mapHypernativeResponse'

const mockBuildHypernativeBatchRequestData = buildHypernativeBatchRequestData as jest.MockedFunction<
  typeof buildHypernativeBatchRequestData
>
const mockMapHypernativeResponse = mapHypernativeResponse as jest.MockedFunction<typeof mapHypernativeResponse>

describe('useThreatAnalysisHypernativeBatch', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockAuthToken = 'test-bearer-token-123'

  const createMockBatchResponse = (
    hashes: `0x${string}`[],
    includeNotFound = false,
  ): HypernativeBatchAssessmentResponseItemDto[] => {
    return hashes.map((hash, index) => {
      if (includeNotFound && index === hashes.length - 1) {
        return {
          safeTxHash: hash,
          status: 'NOT_FOUND' as const,
          assessmentData: null,
        }
      }

      return {
        safeTxHash: hash,
        status: 'OK' as const,
        assessmentData: {
          assessmentId: faker.string.uuid(),
          assessmentTimestamp: new Date().toISOString(),
          recommendation: 'accept',
          interpretation: `Transaction ${index + 1}`,
          findings: {
            THREAT_ANALYSIS: {
              status: 'No risks found',
              severity: 'accept',
              risks: [],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }
    })
  }

  const mockTriggerBatchAssessment = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockBuildHypernativeBatchRequestData.mockReturnValue({
      safeTxHashes: [],
    })

    mockUseGetBatchAssessmentsMutation.mockReturnValue([
      mockTriggerBatchAssessment,
      { data: undefined, error: undefined, isLoading: false },
    ] as any)
  })

  describe('with transaction hashes', () => {
    it('should trigger batch assessment with valid hashes', async () => {
      const hashes = [
        faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
        faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
      ]

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockBuildHypernativeBatchRequestData).toHaveBeenCalledWith(hashes)
        expect(mockTriggerBatchAssessment).toHaveBeenCalledWith({
          safeTxHashes: hashes,
          authToken: mockAuthToken,
        })
      })
    })

    it('should not trigger when skip is true', async () => {
      const hashes = [faker.string.hexadecimal({ length: 64 }) as `0x${string}`]

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerBatchAssessment).not.toHaveBeenCalled()
      })
    })

    it('should return error when authToken is missing', () => {
      const hashes = [faker.string.hexadecimal({ length: 64 }) as `0x${string}`]

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
        }),
      )

      expect(result.current[hashes[0]]).toEqual([undefined, expect.any(Error), false])
      expect((result.current[hashes[0]][1] as Error).message).toBe('authToken is required')
    })

    it('should not trigger when buildHypernativeBatchRequestData returns undefined', async () => {
      const hashes = [faker.string.hexadecimal({ length: 64 }) as `0x${string}`]

      mockBuildHypernativeBatchRequestData.mockReturnValue(undefined)

      renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockBuildHypernativeBatchRequestData).toHaveBeenCalledWith(hashes)
        expect(mockTriggerBatchAssessment).not.toHaveBeenCalled()
      })
    })
  })

  describe('response handling', () => {
    it('should map successful batch response to results', async () => {
      const hashes = [
        faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
        faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
      ]

      const batchResponse = createMockBatchResponse(hashes)
      const mockThreatAnalysis1 = { [StatusGroup.COMMON]: [] }
      const mockThreatAnalysis2 = { [StatusGroup.COMMON]: [] }

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      mockMapHypernativeResponse.mockReturnValueOnce(mockThreatAnalysis1).mockReturnValueOnce(mockThreatAnalysis2)

      mockUseGetBatchAssessmentsMutation.mockReturnValue([
        mockTriggerBatchAssessment,
        { data: batchResponse, error: undefined, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(result.current[hashes[0]]).toEqual([mockThreatAnalysis1, undefined, false])
        expect(result.current[hashes[1]]).toEqual([mockThreatAnalysis2, undefined, false])
      })
    })

    it('should handle NOT_FOUND status', async () => {
      const hashes = [
        faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
        faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
      ]

      const batchResponse = createMockBatchResponse(hashes, true) // last one is NOT_FOUND
      const mockThreatAnalysis1 = { [StatusGroup.COMMON]: [] }

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      mockMapHypernativeResponse.mockReturnValueOnce(mockThreatAnalysis1)

      mockUseGetBatchAssessmentsMutation.mockReturnValue([
        mockTriggerBatchAssessment,
        { data: batchResponse, error: undefined, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(result.current[hashes[0]]).toEqual([mockThreatAnalysis1, undefined, false])
        expect(result.current[hashes[1]]).toEqual([undefined, undefined, false]) // NOT_FOUND
      })
    })

    it('should handle batch-level errors', async () => {
      const hashes = [faker.string.hexadecimal({ length: 64 }) as `0x${string}`]

      const errorResponse: HypernativeBatchAssessmentErrorDto = {
        status: 'FAILED',
        error: {
          reason: 'INVALID_REQUEST',
          message: 'transactions must be a non-empty array',
        },
      }

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      mockUseGetBatchAssessmentsMutation.mockReturnValue([
        mockTriggerBatchAssessment,
        { data: undefined, error: errorResponse, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(result.current[hashes[0]]).toEqual([undefined, expect.any(Error), false])
        expect((result.current[hashes[0]][1] as Error).message).toBe('transactions must be a non-empty array')
      })
    })

    it('should handle loading state', () => {
      const hashes = [faker.string.hexadecimal({ length: 64 }) as `0x${string}`]

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      mockUseGetBatchAssessmentsMutation.mockReturnValue([
        mockTriggerBatchAssessment,
        { data: undefined, error: undefined, isLoading: true },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      expect(result.current[hashes[0]]).toEqual([undefined, undefined, true])
    })

    it('should handle mapping errors', async () => {
      const hashes = [faker.string.hexadecimal({ length: 64 }) as `0x${string}`]

      const batchResponse = createMockBatchResponse(hashes)

      mockBuildHypernativeBatchRequestData.mockReturnValue({
        safeTxHashes: hashes,
      })

      mockMapHypernativeResponse.mockImplementation(() => {
        throw new Error('Mapping failed')
      })

      mockUseGetBatchAssessmentsMutation.mockReturnValue([
        mockTriggerBatchAssessment,
        { data: batchResponse, error: undefined, isLoading: false },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeBatch({
          safeTxHashes: hashes,
          safeAddress: mockSafeAddress,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(result.current[hashes[0]]).toEqual([undefined, expect.any(Error), false])
        expect((result.current[hashes[0]][1] as Error).message).toBe('Mapping failed')
      })
    })
  })
})
