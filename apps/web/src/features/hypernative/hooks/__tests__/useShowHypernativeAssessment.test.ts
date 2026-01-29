import { renderHook } from '@/tests/test-utils'
import { useShowHypernativeAssessment } from '../useShowHypernativeAssessment'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useIsHypernativeEligibleHook from '../useIsHypernativeEligible'
import * as useIsHypernativeFeatureHook from '../useIsHypernativeFeature'
import * as useIsHypernativeQueueScanFeatureHook from '../useIsHypernativeQueueScanFeature'
import * as useIsSafeOwnerHook from '@/hooks/useIsSafeOwner'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

describe('useShowHypernativeAssessment', () => {
  const mockSafe = extendedSafeInfoBuilder().with({ chainId: '1' }).build()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultMocks = {
    useSafeInfo: {
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    },
    useIsHypernativeFeature: true,
    useIsHypernativeEligible: {
      isHypernativeEligible: true,
      isHypernativeGuard: false,
      isAllowlistedSafe: false,
      loading: false,
    },
    useIsHypernativeQueueScanFeature: true,
    useIsSafeOwner: true,
  }

  const setupMocks = (overrides: Partial<typeof defaultMocks> = {}) => {
    const mocks = { ...defaultMocks, ...overrides }
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(mocks.useSafeInfo)
    jest.spyOn(useIsHypernativeFeatureHook, 'useIsHypernativeFeature').mockReturnValue(mocks.useIsHypernativeFeature)
    jest.spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible').mockReturnValue(mocks.useIsHypernativeEligible)
    jest
      .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
      .mockReturnValue(mocks.useIsHypernativeQueueScanFeature)
    jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(mocks.useIsSafeOwner)
  }

  describe('when all conditions are met', () => {
    it('should return true', () => {
      setupMocks()

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(true)
    })
  })

  describe('when isQueue is false', () => {
    it('should return false', () => {
      setupMocks()

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: false,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when isHypernativeFeatureEnabled is false', () => {
    it('should return false', () => {
      setupMocks({ useIsHypernativeFeature: false })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when isHypernativeQueueScanEnabled is false', () => {
    it('should return false', () => {
      setupMocks({ useIsHypernativeQueueScanFeature: false })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when isHypernativeEligible is false', () => {
    it('should return false', () => {
      setupMocks({
        useIsHypernativeEligible: {
          ...defaultMocks.useIsHypernativeEligible,
          isHypernativeEligible: false,
        },
      })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when hnEligibilityLoading is true', () => {
    it('should return false', () => {
      setupMocks({
        useIsHypernativeEligible: {
          ...defaultMocks.useIsHypernativeEligible,
          loading: true,
        },
      })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when safeTxHash is undefined', () => {
    it('should return false', () => {
      setupMocks()

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: undefined,
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when safeTxHash is empty string', () => {
    it('should return false', () => {
      setupMocks()

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when chainId is undefined', () => {
    it('should return false', () => {
      const safeWithoutChainId = extendedSafeInfoBuilder().with({ chainId: '' }).build()
      setupMocks({
        useSafeInfo: {
          ...defaultMocks.useSafeInfo,
          safe: safeWithoutChainId,
        },
      })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when isSafeOwner is false', () => {
    it('should return false', () => {
      setupMocks({ useIsSafeOwner: false })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when multiple conditions are not met', () => {
    it('should return false when isQueue is false and isHypernativeEligible is false', () => {
      setupMocks({
        useIsHypernativeEligible: {
          ...defaultMocks.useIsHypernativeEligible,
          isHypernativeEligible: false,
        },
      })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: false,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })

    it('should return false when safeTxHash is undefined and chainId is empty', () => {
      const safeWithoutChainId = extendedSafeInfoBuilder().with({ chainId: '' }).build()
      setupMocks({
        useSafeInfo: {
          ...defaultMocks.useSafeInfo,
          safe: safeWithoutChainId,
        },
      })

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: true,
          safeTxHash: undefined,
        }),
      )

      expect(result.current).toBe(false)
    })
  })
})
