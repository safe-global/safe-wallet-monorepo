import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { useThreatAnalysisHypernativeBatch } from '../useThreatAnalysisHypernativeBatch'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ConflictType } from '@safe-global/store/gateway/types'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useAuthTokenHook from '../useAuthToken'
import * as useThreatAnalysisHypernativeBatchHook from '@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch'
import { hnQueueAssessmentsSlice } from '../../store/hnQueueAssessmentsSlice'
import type { RootState } from '@/store'

jest.mock('@/hooks/useSafeInfo')
jest.mock('../useAuthToken')
jest.mock('@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch')

const mockUseSafeInfo = useSafeInfoHook.default as jest.MockedFunction<typeof useSafeInfoHook.default>
const mockUseAuthToken = useAuthTokenHook.useAuthToken as jest.MockedFunction<typeof useAuthTokenHook.useAuthToken>
const mockUseThreatAnalysisHypernativeBatch =
  useThreatAnalysisHypernativeBatchHook.useThreatAnalysisHypernativeBatch as jest.MockedFunction<
    typeof useThreatAnalysisHypernativeBatchHook.useThreatAnalysisHypernativeBatch
  >

describe('useThreatAnalysisHypernativeBatch', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockAuthToken = 'Bearer test-token-123'

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseSafeInfo.mockReturnValue({
      safe: {
        chainId: '1',
        address: mockSafeAddress,
      } as any,
      safeAddress: mockSafeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    mockUseAuthToken.mockReturnValue([
      {
        token: mockAuthToken,
        isAuthenticated: true,
        isExpired: false,
      },
      jest.fn(),
      jest.fn(),
    ])

    mockUseThreatAnalysisHypernativeBatch.mockReturnValue({})
  })

  const createInitialState = (assessments: Record<`0x${string}`, any> = {}) => {
    return {
      [hnQueueAssessmentsSlice.name]: {
        assessments,
      },
    } as Partial<RootState>
  }

  const createMockTransactionItem = (txId: string) => ({
    type: 'TRANSACTION' as const,
    conflictType: ConflictType.NONE,
    transaction: {
      id: txId,
      timestamp: Date.now(),
      txStatus: 'AWAITING_CONFIRMATIONS' as const,
      txInfo: {} as any,
      executionInfo: {} as any,
    },
  })

  const createMockLabelItem = () => ({
    type: 'LABEL' as const,
    label: 'Next' as const,
  })

  describe('hash extraction', () => {
    it('should extract safeTxHashes from transaction items', () => {
      const safeTxHash1 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
      const safeTxHash2 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash1}`),
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash2}`),
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      const mockAssessments = {
        [safeTxHash1]: [[], undefined, false] as any,
        [safeTxHash2]: [[], undefined, false] as any,
      }

      mockUseThreatAnalysisHypernativeBatch.mockReturnValue(mockAssessments)

      const { result } = renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: expect.arrayContaining([safeTxHash1, safeTxHash2]),
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })

      expect(result.current).toEqual(mockAssessments)
    })

    it('should skip non-transaction items (labels, date labels, etc.)', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [
            createMockLabelItem(),
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`),
            createMockLabelItem(),
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      const mockAssessments = {
        [safeTxHash]: [[], undefined, false] as any,
      }

      mockUseThreatAnalysisHypernativeBatch.mockReturnValue(mockAssessments)

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [safeTxHash],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should handle transactions without IDs', () => {
      const pages: QueuedItemPage[] = [
        {
          results: [
            {
              type: 'TRANSACTION' as const,
              conflictType: ConflictType.NONE,
              transaction: {
                id: undefined as any,
                timestamp: Date.now(),
                txStatus: 'AWAITING_CONFIRMATIONS' as const,
                txInfo: {} as any,
                executionInfo: {} as any,
              },
            },
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should handle transactions with invalid txId format', () => {
      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem('invalid-tx-id'), createMockTransactionItem('not_multisig_format')],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should remove duplicate hashes', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`),
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`),
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [safeTxHash],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should handle multiple pages', () => {
      const safeTxHash1 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
      const safeTxHash2 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash1}`)],
          next: 'next-page-url',
          previous: undefined,
        },
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash2}`)],
          next: undefined,
          previous: 'prev-page-url',
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: expect.arrayContaining([safeTxHash1, safeTxHash2]),
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should handle undefined pages', () => {
      const pages: (QueuedItemPage | undefined)[] = [
        undefined,
        {
          results: [],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should handle pages without results', () => {
      const pages: QueuedItemPage[] = [
        {
          results: undefined as any,
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })
  })

  describe('skip parameter', () => {
    it('should skip assessment when skip is true', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages, skip: true }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: true,
      })
    })

    it('should skip assessment when no hashes are found', () => {
      const pages: QueuedItemPage[] = [
        {
          results: [createMockLabelItem()],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })
  })

  describe('authentication', () => {
    it('should pass auth token to batch hook', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      mockUseAuthToken.mockReturnValue([
        {
          token: 'Bearer custom-token',
          isAuthenticated: true,
          isExpired: false,
        },
        jest.fn(),
        jest.fn(),
      ])

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          authToken: 'Bearer custom-token',
        }),
      )
    })

    it('should handle missing auth token', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      mockUseAuthToken.mockReturnValue([
        {
          token: undefined,
          isAuthenticated: false,
          isExpired: false,
        },
        jest.fn(),
        jest.fn(),
      ])

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          authToken: undefined,
        }),
      )
    })

    it('should not retry null assessments when authToken is still undefined', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      mockUseAuthToken.mockReturnValue([
        {
          token: undefined,
          isAuthenticated: false,
          isExpired: false,
        },
        jest.fn(),
        jest.fn(),
      ])

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState({
          [safeTxHash]: null,
        }),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: undefined,
        skip: false,
      })
    })
  })

  describe('return value', () => {
    it('should return assessment results from batch hook', () => {
      const safeTxHash1 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
      const safeTxHash2 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const mockAssessments = {
        [safeTxHash1]: [undefined, undefined, true] as any, // loading
        [safeTxHash2]: [[], undefined, false] as any, // loaded
      }

      mockUseThreatAnalysisHypernativeBatch.mockReturnValue(mockAssessments)

      const pages: QueuedItemPage[] = [
        {
          results: [
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash1}`),
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash2}`),
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      const { result } = renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(result.current).toEqual(mockAssessments)
    })

    it('should merge cached assessments with fetched assessments', () => {
      const safeTxHash1 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
      const safeTxHash2 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const cachedAssessment = { severity: 'OK' } as any

      const mockFetchedAssessments = {
        [safeTxHash2]: [[], undefined, false] as any,
      }

      mockUseThreatAnalysisHypernativeBatch.mockReturnValue(mockFetchedAssessments)

      const pages: QueuedItemPage[] = [
        {
          results: [
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash1}`),
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash2}`),
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      const { result } = renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState({
          [safeTxHash1]: cachedAssessment,
        }),
      })

      expect(result.current[safeTxHash1]).toEqual([cachedAssessment, undefined, false])
      expect(result.current[safeTxHash2]).toEqual(mockFetchedAssessments[safeTxHash2])
    })

    it('should convert cached null (error) back to AsyncResult with error', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      const { result } = renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState({
          [safeTxHash]: null,
        }),
      })

      const [data, error, loading] = result.current[safeTxHash]
      expect(data).toBeUndefined()
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Assessment failed')
      expect(loading).toBe(false)
    })

    it('should only fetch hashes not in cache', () => {
      const safeTxHash1 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
      const safeTxHash2 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const cachedAssessment = { severity: 'OK' } as any

      const pages: QueuedItemPage[] = [
        {
          results: [
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash1}`),
            createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash2}`),
          ],
          next: undefined,
          previous: undefined,
        },
      ]

      renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState({
          [safeTxHash1]: cachedAssessment,
        }),
      })

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [safeTxHash2],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: false,
      })
    })

    it('should store null for errors in Redux', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

      const mockAssessments = {
        [safeTxHash]: [undefined, new Error('Test error'), false] as any,
      }

      mockUseThreatAnalysisHypernativeBatch.mockReturnValue(mockAssessments)

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      const { result: store } = renderHook(
        () => {
          const hookResult = useThreatAnalysisHypernativeBatch({ pages })
          return hookResult
        },
        {
          initialReduxState: createInitialState(),
        },
      )

      expect(store.current[safeTxHash]).toEqual(mockAssessments[safeTxHash])
    })

    it('should store data for successful assessments in Redux', () => {
      const safeTxHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
      const mockData = { severity: 'OK' } as any

      const mockAssessments = {
        [safeTxHash]: [mockData, undefined, false] as any,
      }

      mockUseThreatAnalysisHypernativeBatch.mockReturnValue(mockAssessments)

      const pages: QueuedItemPage[] = [
        {
          results: [createMockTransactionItem(`multisig_${mockSafeAddress}_${safeTxHash}`)],
          next: undefined,
          previous: undefined,
        },
      ]

      const { result } = renderHook(() => useThreatAnalysisHypernativeBatch({ pages }), {
        initialReduxState: createInitialState(),
      })

      expect(result.current[safeTxHash]).toEqual(mockAssessments[safeTxHash])
    })
  })
})
