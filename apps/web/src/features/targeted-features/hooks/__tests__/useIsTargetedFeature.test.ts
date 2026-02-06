import { faker } from '@faker-js/faker'

import * as useOutreachSafeHook from '../useIsOutreachSafe'
import * as useChainsHook from '@/hooks/useChains'
import * as useLocalStorageHook from '@/services/local-storage/useLocalStorage'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useIsTargetedFeature, type TargetedFeatures } from '@/features/targeted-features'

jest.mock('../../constants', () => ({
  TARGETED_FEATURES: [
    { id: 1, feature: 'FEATURE_1' },
    { id: 2, feature: 'FEATURE_2' },
    { id: 3, feature: 'FEATURE_3' },
  ],
}))

const targetedFeatures = ['FEATURE_1', 'FEATURE_2', 'FEATURE_3']

describe('useIsTargetedFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true if the Safe is targeted and the feature is enabled', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature as TargetedFeatures))

    expect(result.current).toBe(true)
  })

  it('returns true if the the feature is unlocked and enabled', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: false, loading: false })
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature as TargetedFeatures))

    expect(result.current).toBe(true)
  })

  it('returns false if the Safe is targeted but the feature is disabled', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(false)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature as TargetedFeatures))

    expect(result.current).toBe(false)
  })

  it('returns false if the Safe is targeted and the feature is unlocked', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(false)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], jest.fn()])

    const { result } = renderHook(() => useIsTargetedFeature(feature as TargetedFeatures))

    expect(result.current).toBe(false)
  })

  it('caches targeted/enabled features', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    const setLocalStorageMock = jest.fn()
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: false })
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[feature], setLocalStorageMock])

    renderHook(() => useIsTargetedFeature(feature as TargetedFeatures))

    waitFor(() => {
      expect(setLocalStorageMock).toHaveBeenCalledWith([feature])
    })
  })

  it('does not unlock features while outreach targeting is loading', () => {
    const feature = faker.helpers.arrayElement(targetedFeatures)
    const setLocalStorageMock = jest.fn()
    jest.spyOn(useChainsHook, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(useOutreachSafeHook, 'useIsOutreachSafe').mockReturnValue({ isTargeted: true, loading: true })
    jest.spyOn(useLocalStorageHook, 'default').mockReturnValue([[], setLocalStorageMock])

    const { result } = renderHook(() => useIsTargetedFeature(feature as TargetedFeatures))

    expect(result.current).toBe(false)
    expect(setLocalStorageMock).not.toHaveBeenCalled()
  })
})
