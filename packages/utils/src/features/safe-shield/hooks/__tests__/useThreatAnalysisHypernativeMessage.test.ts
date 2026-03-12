import { renderHook, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useThreatAnalysisHypernativeMessage } from '../useThreatAnalysisHypernativeMessage'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type {
  HypernativeMessageAssessmentResponseDto,
  HypernativeMessageAssessmentErrorDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'

jest.mock('@safe-global/store/hypernative/hypernativeApi', () => ({
  hypernativeApi: {
    useAssessMessageMutation: jest.fn(),
  },
}))

const mockUseAssessMessageMutation = hypernativeApi.useAssessMessageMutation as jest.MockedFunction<
  typeof hypernativeApi.useAssessMessageMutation
>

describe('useThreatAnalysisHypernativeMessage', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockChainId = '1'
  const mockMessageHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
  const mockAuthToken = 'test-bearer-token-123'

  const createMockTypedData = (): TypedData => ({
    domain: {
      chainId: 1,
      verifyingContract: mockSafeAddress,
    },
    primaryType: 'Permit',
    types: {
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    message: {
      owner: faker.finance.ethereumAddress(),
      spender: faker.finance.ethereumAddress(),
      value: '1000000',
      nonce: 0,
      deadline: 9999999999,
    },
  })

  const createMockHypernativeResponse = (): HypernativeMessageAssessmentResponseDto['data'] => ({
    safeTxHash: mockMessageHash,
    status: 'OK',
    assessmentData: {
      assessmentId: faker.string.uuid(),
      assessmentTimestamp: new Date().toISOString(),
      recommendation: 'accept',
      interpretation: 'Permit signature to approve token transfer',
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
  })

  const mockTriggerAssessment = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAssessMessageMutation.mockReturnValue([
      mockTriggerAssessment,
      { data: undefined, error: undefined, isLoading: false },
    ] as any)
  })

  describe('API calls', () => {
    it('should trigger mutation with correct payload', async () => {
      const mockTypedData = createMockTypedData()
      const mockOrigin = 'https://app.example.com'

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          origin: mockOrigin,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(
          expect.objectContaining({
            safeAddress: mockSafeAddress,
            messageHash: mockMessageHash,
            authToken: mockAuthToken,
            url: mockOrigin,
            message: expect.objectContaining({
              primaryType: 'Permit',
              domain: mockTypedData.domain,
              message: mockTypedData.message,
            }),
          }),
        )
      })
    })

    it('should not trigger mutation when typedData is undefined', () => {
      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: undefined,
          authToken: mockAuthToken,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should not trigger mutation when authToken is missing', () => {
      const mockTypedData = createMockTypedData()

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should not trigger mutation twice for the same messageHash', async () => {
      const mockTypedData = createMockTypedData()

      const { rerender } = renderHook(
        ({ typedData }) =>
          useThreatAnalysisHypernativeMessage({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            messageHash: mockMessageHash,
            typedData,
            authToken: mockAuthToken,
          }),
        { initialProps: { typedData: mockTypedData } },
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })

      // Rerender with same messageHash (different typedData object, same hash)
      rerender({ typedData: { ...mockTypedData } })

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledTimes(1)
      })
    })

    it('should include proposer when provided', async () => {
      const mockTypedData = createMockTypedData()
      const mockProposer = faker.finance.ethereumAddress() as `0x${string}`

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          proposer: mockProposer,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(expect.objectContaining({ proposer: mockProposer }))
      })
    })

    it('should parse origin from JSON string with url property', async () => {
      const mockTypedData = createMockTypedData()
      const inputUrl = 'https://parsed.example.com'
      const jsonOrigin = JSON.stringify({ url: inputUrl })

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          origin: jsonOrigin,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(expect.objectContaining({ url: inputUrl }))
      })
    })

    it('should use domain.chainId when present', async () => {
      const mockTypedData = createMockTypedData() // domain.chainId = 1

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: '137', // different from domain
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(
          expect.objectContaining({ chain: '1' }), // domain.chainId wins
        )
      })
    })

    it('should fall back to chainId prop when domain has no chainId', async () => {
      const mockTypedData: TypedData = {
        ...createMockTypedData(),
        domain: { verifyingContract: mockSafeAddress }, // no chainId
      }

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: '137',
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        expect(mockTriggerAssessment).toHaveBeenCalledWith(expect.objectContaining({ chain: '137' }))
      })
    })
  })

  describe('return values', () => {
    it('should return error when no authToken provided', () => {
      const mockTypedData = createMockTypedData()

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
        }),
      )

      const [, error] = result.current
      expect(error).toBeDefined()
      expect(error?.message).toBe('authToken is required')
      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should return mapped threat data when successful', async () => {
      const mockTypedData = createMockTypedData()
      const mockResponse = createMockHypernativeResponse()
      mockUseAssessMessageMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data, error, loading] = result.current
        expect(data).toBeDefined()
        expect(data?.[StatusGroup.THREAT]).toBeDefined()
        expect(error).toBeUndefined()
        expect(loading).toBe(false)
      })
    })

    it('should return error result when mutation fails with structured error', async () => {
      const mockTypedData = createMockTypedData()
      const mockError: HypernativeMessageAssessmentErrorDto = {
        status: 'FAILED',
        error: {
          reason: 'MESSAGE_HASH_MISMATCH',
          message: 'The provided messageHash does not match the computed hash',
        },
      }
      mockUseAssessMessageMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: undefined, error: mockError, isLoading: false, reset: jest.fn() },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data, error] = result.current
        expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
        expect(error?.message).toContain('MESSAGE_HASH_MISMATCH')
      })
    })

    it('should return generic error result when mutation fails with unknown error', async () => {
      const mockTypedData = createMockTypedData()
      mockUseAssessMessageMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: undefined, error: new Error('Network error'), isLoading: false, reset: jest.fn() },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data, error] = result.current
        expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
        expect(error?.message).toBe('Failed to fetch Hypernative message threat analysis')
      })
    })

    it('should return loading state when mutation is in progress', () => {
      const mockTypedData = createMockTypedData()
      mockUseAssessMessageMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: undefined, error: undefined, isLoading: true, reset: jest.fn() },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      const [, , loading] = result.current
      expect(loading).toBe(true)
    })

    it('should return CRITICAL threat when deny risk detected', async () => {
      const mockTypedData = createMockTypedData()
      const mockResponse: HypernativeMessageAssessmentResponseDto['data'] = {
        ...createMockHypernativeResponse(),
        assessmentData: {
          assessmentId: faker.string.uuid(),
          assessmentTimestamp: new Date().toISOString(),
          recommendation: 'deny',
          interpretation: 'Malicious permit signature',
          findings: {
            THREAT_ANALYSIS: {
              status: 'Risks found',
              severity: 'deny',
              risks: [
                {
                  title: 'Malicious permit',
                  details: 'Permit signature to known malicious spender.',
                  severity: 'deny',
                  safeCheckId: faker.string.alphanumeric(10),
                },
              ],
            },
            CUSTOM_CHECKS: {
              status: 'Passed',
              severity: 'accept',
              risks: [],
            },
          },
        },
      }
      mockUseAssessMessageMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
        }),
      )

      await waitFor(() => {
        const [data] = result.current
        expect(data?.[StatusGroup.THREAT]?.[0]).toEqual(
          expect.objectContaining({
            severity: Severity.CRITICAL,
            type: ThreatStatus.HYPERNATIVE_GUARD,
          }),
        )
      })
    })
  })

  describe('skip parameter', () => {
    it('should not trigger mutation when skip is true', () => {
      const mockTypedData = createMockTypedData()

      renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: mockTypedData,
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })

    it('should return undefined result when skip is true', () => {
      const mockResponse = createMockHypernativeResponse()
      mockUseAssessMessageMutation.mockReturnValue([
        mockTriggerAssessment,
        { data: mockResponse, error: undefined, isLoading: false, reset: jest.fn() },
      ] as any)

      const { result } = renderHook(() =>
        useThreatAnalysisHypernativeMessage({
          safeAddress: mockSafeAddress,
          chainId: mockChainId,
          messageHash: mockMessageHash,
          typedData: createMockTypedData(),
          authToken: mockAuthToken,
          skip: true,
        }),
      )

      const [data, error, loading] = result.current
      expect(data).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should not throw error when skip is true and authToken is missing', () => {
      expect(() =>
        renderHook(() =>
          useThreatAnalysisHypernativeMessage({
            safeAddress: mockSafeAddress,
            chainId: mockChainId,
            messageHash: mockMessageHash,
            typedData: createMockTypedData(),
            skip: true,
          }),
        ),
      ).not.toThrow()

      expect(mockTriggerAssessment).not.toHaveBeenCalled()
    })
  })
})
