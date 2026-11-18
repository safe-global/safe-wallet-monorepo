import { renderHook } from '@/tests/test-utils'
import type { FeatureHandle, FeatureImplementation } from '@/features/__core__/types'

const ALWAYS_ENABLED_FEATURES: Array<{ label: string; getHandle: () => FeatureHandle<FeatureImplementation> }> = [
  { label: 'spaces', getHandle: () => jest.requireActual('@/features/spaces/SpacesFeature').SpacesFeature },
]

describe('always-enabled features', () => {
  it.each(ALWAYS_ENABLED_FEATURES)('$label: useIsEnabled returns true unconditionally', ({ getHandle }) => {
    const { result } = renderHook(() => getHandle().useIsEnabled())
    expect(result.current).toBe(true)
  })

  it.each(ALWAYS_ENABLED_FEATURES)('$label: has correct name', ({ label, getHandle }) => {
    expect(getHandle().name).toBe(label)
  })
})
