import { faker } from '@faker-js/faker'
import * as targetedMessages from '@safe-global/store/gateway/AUTO_GENERATED/targeted-messages'

import * as useChainsHook from '@/hooks/useChains'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useLocalStorageHook from '@/services/local-storage/useLocalStorage'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { renderHook, waitFor } from '@/tests/test-utils'
import * as useIsTargetedSafeHook from '../useIsTargetedSafe'
import { useIsTargetedFeature, useIsTargetedSafe } from '../useIsTargetedSafe'
import { TARGETED_FEATURES } from '../../constants'

const targetedFeatureOutreachIds = TARGETED_FEATURES.map((f) => f.id)
const targetedFeatures = TARGETED_FEATURES.map((f) => f.feature)

describe('Targeted Safe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useIsTargetedSafe', () => {
    it('returns true if the Safe is targeted', () => {
      const safeInfo = safeInfoBuilder().build()
      const outreachId = faker.helpers.arrayElement(targetedFeatureOutreachIds)
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: safeInfo.address.value,
        safe: {
          ...safeInfo,
          deployed: true,
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })
      jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
        data: {
          outreachId,
          address: safeInfo.address.value,
        },
        refetch: jest.fn(),
      })

      const { result } = renderHook(() => useIsTargetedSafe(outreachId))

      expect(result.current).toBe(true)
    })

    it('returns false if the Safe is not targeted', () => {
      const safeInfo = safeInfoBuilder().build()
      const outreachId = faker.helpers.arrayElement(targetedFeatureOutreachIds)
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: safeInfo.address.value,
        safe: {
          ...safeInfo,
          deployed: true,
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })
      jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
        data: undefined,
        error: new Error('Safe not targeted'),
        refetch: jest.fn(),
      })

      const { result } = renderHook(() => useIsTargetedSafe(outreachId))

      expect(result.current).toBe(false)
    })

    it('returns false if the data is not available', () => {
      const safeInfo = safeInfoBuilder().build()
      const outreachId = faker.helpers.arrayElement(targetedFeatureOutreachIds)
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: safeInfo.address.value,
        safe: {
          ...safeInfo,
          deployed: true,
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })
      jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
        data: undefined, // Yet to be fetched
        refetch: jest.fn(),
      })

      const { result } = renderHook(() => useIsTargetedSafe(outreachId))

      expect(result.current).toBe(false)
    })

    it('returns false if the outreachId does not match', () => {
      const safeInfo = safeInfoBuilder().build()
      const outreachId = faker.helpers.arrayElement(targetedFeatureOutreachIds)
      const otherOutreachId = 'OTHER_FEATURE'
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: safeInfo.address.value,
        safe: {
          ...safeInfo,
          deployed: true,
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })
      jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
        data: {
          outreachId: otherOutreachId,
          address: safeInfo.address.value,
        },
        refetch: jest.fn(),
      })

      const { result } = renderHook(() => useIsTargetedSafe(outreachId))

      expect(result.current).toBe(false)
    })

    it('returns false if the address does not match', () => {
      const safeInfo = safeInfoBuilder().build()
      const otherAddress = faker.finance.ethereumAddress()
      const outreachId = faker.helpers.arrayElement(targetedFeatureOutreachIds)
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safeAddress: safeInfo.address.value,
        safe: {
          ...safeInfo,
          deployed: true,
        },
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })
      jest.spyOn(targetedMessages, 'useTargetedMessagingGetTargetedSafeV1Query').mockReturnValue({
        data: {
          outreachId,
          address: otherAddress,
        },
        refetch: jest.fn(),
      })

      const { result } = renderHook(() => useIsTargetedSafe(outreachId))

      expect(result.current).toBe(false)
    })
  })

  describe('useIsTargetedFeature', () => {
    it('returns true if the Safe is targeted and the feature is enabled', () => {
      const feature = faker.helpers.arrayElement(targetedFeatures)
      jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
      jest.spyOn(useIsTargetedSafeHook, 'useIsTargetedSafe').mockReturnValue(true)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

      const { result } = renderHook(() => useIsTargetedFeature(feature))

      expect(result.current).toBe(true)
    })

    it('returns true if the the feature is unlocked and enabled', () => {
      const feature = faker.helpers.arrayElement(targetedFeatures)
      jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
      jest.spyOn(useIsTargetedSafeHook, 'useIsTargetedSafe').mockReturnValue(false)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

      const { result } = renderHook(() => useIsTargetedFeature(feature))

      expect(result.current).toBe(true)
    })

    it('returns false if the Safe is targeted but the feature is disabled', () => {
      const feature = faker.helpers.arrayElement(targetedFeatures)
      jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(false)
      jest.spyOn(useIsTargetedSafeHook, 'useIsTargetedSafe').mockReturnValue(true)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[], jest.fn()])

      const { result } = renderHook(() => useIsTargetedFeature(feature))

      expect(result.current).toBe(false)
    })

    it('returns false if the Safe is targeted and the feature is unlocked', () => {
      const feature = faker.helpers.arrayElement(targetedFeatures)
      jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(false)
      jest.spyOn(useIsTargetedSafeHook, 'useIsTargetedSafe').mockReturnValue(true)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

      const { result } = renderHook(() => useIsTargetedFeature(feature))

      expect(result.current).toBe(false)
    })

    it('caches targeted/enabled features', () => {
      const feature = faker.helpers.arrayElement(targetedFeatures)
      const setLocalStorageMock = jest.fn()
      jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
      jest.spyOn(useIsTargetedSafeHook, 'useIsTargetedSafe').mockReturnValue(true)
      jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

      renderHook(() => useIsTargetedFeature(feature))

      waitFor(() => {
        expect(setLocalStorageMock).toHaveBeenCalledWith([feature])
      })
    })
  })
})
