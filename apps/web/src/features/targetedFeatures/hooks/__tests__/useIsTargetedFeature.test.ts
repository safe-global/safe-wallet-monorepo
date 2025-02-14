import { faker } from '@faker-js/faker'

import * as useOutreachSafeHook from '@/features/targetedFeatures/hooks/useIsOutreachSafe'
import * as useChainsHook from '@/hooks/useChains'
import * as useLocalStorageHook from '@/services/local-storage/useLocalStorage'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useIsTargetedFeature } from '../useIsTargetedFeature'
import { TARGETED_FEATURES } from '../../constants'

const targetedFeatures = TARGETED_FEATURES.map((f) => f.feature)

describe('useIsTargetedFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true if the Safe is targeted and the feature is enabled', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(true)
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature))

    expect(result.current).toBe(true)
  })

  it('returns true if the the feature is unlocked and enabled', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(false)
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature))

    expect(result.current).toBe(true)
  })

  it('returns false if the Safe is targeted but the feature is disabled', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(false)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(true)
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature))

    expect(result.current).toBe(false)
  })

  it('returns false if the Safe is targeted and the feature is unlocked', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(false)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(true)
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature))

    expect(result.current).toBe(false)
  })

  it('caches targeted/enabled features', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    const setLocalStorageMock = jest.fn()
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue(true)
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    renderHook(() => useIsTargetedFeature(feature))

    waitFor(() => {
      expect(setLocalStorageMock).toHaveBeenCalledWith([feature])
    })
  })
})
