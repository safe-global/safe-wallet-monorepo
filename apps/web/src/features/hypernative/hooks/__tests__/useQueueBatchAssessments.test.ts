import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useQueueBatchAssessments } from '../useQueueBatchAssessments'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ConflictType } from '@safe-global/store/gateway/types'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useAuthTokenHook from '../useAuthToken'
import * as useThreatAnalysisHypernativeBatchHook from '@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch'

jest.mock('@/hooks/useSafeInfo')
jest.mock('../useAuthToken')
jest.mock('@safe-global/utils/features/safe-shield/hooks/useThreatAnalysisHypernativeBatch')

const mockUseSafeInfo = useSafeInfoHook.default as jest.MockedFunction<typeof useSafeInfoHook.default>
const mockUseAuthToken = useAuthTokenHook.useAuthToken as jest.MockedFunction<typeof useAuthTokenHook.useAuthToken>
const mockUseThreatAnalysisHypernativeBatch =
  useThreatAnalysisHypernativeBatchHook.useThreatAnalysisHypernativeBatch as jest.MockedFunction<
    typeof useThreatAnalysisHypernativeBatchHook.useThreatAnalysisHypernativeBatch
  >

describe('useQueueBatchAssessments', () => {
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

      const { result } = renderHook(() => useQueueBatchAssessments({ pages }))

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

      renderHook(() => useQueueBatchAssessments({ pages }))

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

      renderHook(() => useQueueBatchAssessments({ pages }))

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: true,
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

      renderHook(() => useQueueBatchAssessments({ pages }))

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: true,
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

      renderHook(() => useQueueBatchAssessments({ pages }))

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

      renderHook(() => useQueueBatchAssessments({ pages }))

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

      renderHook(() => useQueueBatchAssessments({ pages }))

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: true,
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

      renderHook(() => useQueueBatchAssessments({ pages }))

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: true,
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

      renderHook(() => useQueueBatchAssessments({ pages, skip: true }))

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

      renderHook(() => useQueueBatchAssessments({ pages }))

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith({
        safeTxHashes: [],
        safeAddress: mockSafeAddress,
        authToken: mockAuthToken,
        skip: true,
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

      renderHook(() => useQueueBatchAssessments({ pages }))

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

      renderHook(() => useQueueBatchAssessments({ pages }))

      expect(mockUseThreatAnalysisHypernativeBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          authToken: undefined,
        }),
      )
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

      const { result } = renderHook(() => useQueueBatchAssessments({ pages }))

      expect(result.current).toEqual(mockAssessments)
    })
  })
})
