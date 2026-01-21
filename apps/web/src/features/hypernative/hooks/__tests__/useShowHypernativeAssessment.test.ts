import { renderHook } from '@/tests/test-utils'
import { useShowHypernativeAssessment } from '../useShowHypernativeAssessment'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useIsHypernativeEligibleHook from '../useIsHypernativeEligible'
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
    useIsHypernativeEligible: {
      isHypernativeEligible: true,
      isHypernativeGuard: false,
      isAllowlistedSafe: false,
      loading: false,
    },
    useIsHypernativeQueueScanFeature: true,
    useIsSafeOwner: true,
  }

  describe('when all conditions are met', () => {
    it('should return true', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

      const { result } = renderHook(() =>
        useShowHypernativeAssessment({
          isQueue: false,
          safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        }),
      )

      expect(result.current).toBe(false)
    })
  })

  describe('when isHypernativeQueueScanEnabled is false', () => {
    it('should return false', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest.spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature').mockReturnValue(false)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest.spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible').mockReturnValue({
        ...defaultMocks.useIsHypernativeEligible,
        isHypernativeEligible: false,
      })
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest.spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible').mockReturnValue({
        ...defaultMocks.useIsHypernativeEligible,
        loading: true,
      })
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        ...defaultMocks.useSafeInfo,
        safe: safeWithoutChainId,
      })
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(false)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue(defaultMocks.useSafeInfo)
      jest.spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible').mockReturnValue({
        ...defaultMocks.useIsHypernativeEligible,
        isHypernativeEligible: false,
      })
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        ...defaultMocks.useSafeInfo,
        safe: safeWithoutChainId,
      })
      jest
        .spyOn(useIsHypernativeEligibleHook, 'useIsHypernativeEligible')
        .mockReturnValue(defaultMocks.useIsHypernativeEligible)
      jest
        .spyOn(useIsHypernativeQueueScanFeatureHook, 'useIsHypernativeQueueScanFeature')
        .mockReturnValue(defaultMocks.useIsHypernativeQueueScanFeature)
      jest.spyOn(useIsSafeOwnerHook, 'default').mockReturnValue(defaultMocks.useIsSafeOwner)

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
